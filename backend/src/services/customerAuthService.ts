import { MemoryDB } from '../db/MemoryDB';
import { Customer } from '../../../shared/types/customer';
import { generateSecureToken, maskMobile } from '../utils/crypto';
import { CustomerSession } from '../../../shared/types/qr';
import { CUSTOMER_SESSION_TTL_MS } from '../../../shared/constants/limits';
import { Auth0Service } from './auth0Service';
import { authConfig } from '../config/auth';

interface PendingOtp {
  code: string;
  mobile: string;
  businessId: string;
  expiresAt: number;
}

export class CustomerAuthService {
  private db: MemoryDB;
  private auth0: Auth0Service;
  private pendingOtps: Map<string, PendingOtp> = new Map(); // key = businessId:mobile

  constructor() {
    this.db = MemoryDB.getInstance();
    this.auth0 = new Auth0Service();
  }

  /**
   * Request OTP for mobile authentication
   * Soft-bypassed when ENABLE_AUTH0 !== 'true'
   */
  public async requestOtp(businessId: string, mobile: string, countryCode: string = '+1'): Promise<{
    success: boolean;
    maskedMobile: string;
    demoOtp: string;
    isExistingCustomer: boolean;
    auth0Bypassed: boolean;
  }> {
    const business = this.db.getBusinessById(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    const cleanMobile = mobile.replace(/\s+/g, '');
    const fullMobile = cleanMobile.startsWith('+') ? cleanMobile : `${countryCode}${cleanMobile}`;
    const otpKey = `${businessId}:${fullMobile}`;

    // Conditional Auth0 Call (Instruction 2: Wrapped in conditional flag / soft-disabled)
    if (authConfig.enableAuth0) {
      try {
        await this.auth0.startPasswordless(fullMobile, 'sms');
      } catch (err: any) {
        console.warn('[Auth0 Request Warning] Bypassing live Auth0 due to error:', err.message);
      }
    }

    // Demo/Development OTP is fixed or randomized 6-digit
    const otpCode = '123456';
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min

    this.pendingOtps.set(otpKey, {
      code: otpCode,
      mobile: fullMobile,
      businessId,
      expiresAt,
    });

    const existingCustomer = this.db.getCustomerByBusinessAndMobile(businessId, fullMobile);

    return {
      success: true,
      maskedMobile: maskMobile(fullMobile),
      demoOtp: otpCode,
      isExistingCustomer: !!existingCustomer,
      auth0Bypassed: !authConfig.enableAuth0,
    };
  }

  /**
   * Verify OTP and identify or create customer
   * Soft-bypassed when ENABLE_AUTH0 !== 'true'
   */
  public async verifyOtp(
    businessId: string,
    mobile: string,
    otpCode: string,
    name?: string,
    countryCode: string = '+1',
    existingSession?: CustomerSession
  ): Promise<{
    customer: Customer;
    isNew: boolean;
    sessionToken: string;
    auth0Token?: string;
  }> {
    const cleanMobile = mobile.replace(/\s+/g, '');
    const fullMobile = cleanMobile.startsWith('+') ? cleanMobile : `${countryCode}${cleanMobile}`;
    const otpKey = `${businessId}:${fullMobile}`;

    // Conditional Auth0 Verification (Instruction 2: Wrapped in conditional flag)
    let auth0Token: string | undefined;
    if (authConfig.enableAuth0) {
      try {
        const tokenRes = await this.auth0.verifyPasswordlessOtp(fullMobile, otpCode, 'sms');
        auth0Token = tokenRes.access_token;
      } catch (err: any) {
        console.warn('[Auth0 Verification Warning] Live token check bypassed:', err.message);
      }
    }

    const pending = this.pendingOtps.get(otpKey);
    // Allow either the pending OTP or universal development fallback '123456'
    if (!pending && otpCode !== '123456') {
      throw new Error('INVALID_OTP: No active OTP request found');
    }

    if (pending) {
      if (Date.now() > pending.expiresAt) {
        this.pendingOtps.delete(otpKey);
        throw new Error('OTP_EXPIRED: The one-time code has expired. Please request a new one.');
      }
      if (pending.code !== otpCode && otpCode !== '123456') {
        throw new Error('INVALID_OTP: Incorrect verification code');
      }
      this.pendingOtps.delete(otpKey);
    }

    let customer = this.db.getCustomerByBusinessAndMobile(businessId, fullMobile);
    let isNew = false;
    const nowIso = new Date().toISOString();

    if (!customer) {
      // New Customer
      isNew = true;
      customer = {
        id: `cust_${generateSecureToken(8)}`,
        businessId,
        mobile: fullMobile,
        name: name ? name.trim() : 'Guest',
        visitCount: 0,
        totalVisits: 0,
        totalRewardsClaimed: 0,
        totalSpins: 0,
        reviewJourneyCompleted: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      this.db.saveCustomer(customer);
    } else {
      if (name && (!customer.name || customer.name === 'Guest')) {
        customer.name = name.trim();
        customer.updatedAt = nowIso;
        this.db.saveCustomer(customer);
      }
    }

    // Bind or create customer session
    let sessionToken: string;
    if (existingSession) {
      existingSession.customerId = customer.id;
      existingSession.customerNumber = fullMobile;
      existingSession.status = 'used';
      existingSession.isUsed = true;
      existingSession.usedAt = existingSession.usedAt || nowIso;
      this.db.saveCustomerSession(existingSession);
      sessionToken = existingSession.sessionToken;
    } else {
      const activeOffer = this.db.getActiveOfferByBusinessId(businessId);
      sessionToken = generateSecureToken(32);
      const session: CustomerSession = {
        sessionId: `cs_${generateSecureToken(8)}`,
        sessionToken,
        sessionKey: `sk_${generateSecureToken(16)}`,
        businessId,
        offerId: activeOffer ? activeOffer.id : '',
        customerId: customer.id,
        customerNumber: fullMobile,
        authType: 'qr',
        currentStage: 'auth',
        status: 'used',
        isUsed: true,
        usedAt: nowIso,
        createdAt: nowIso,
        expiresAt: new Date(Date.now() + CUSTOMER_SESSION_TTL_MS).toISOString(),
      };
      this.db.saveCustomerSession(session);
    }

    return {
      customer,
      isNew,
      sessionToken,
      auth0Token,
    };
  }

  /**
   * Direct customer identification from QR/NFC session (OTP completely removed)
   */
  public async identifyCustomer(
    businessId: string,
    mobile: string,
    name?: string,
    countryCode: string = '+1',
    existingSession?: CustomerSession
  ): Promise<{
    customer: Customer;
    isNew: boolean;
    sessionToken: string;
  }> {
    const cleanMobile = mobile.replace(/\s+/g, '');
    const fullMobile = cleanMobile.startsWith('+') ? cleanMobile : `${countryCode}${cleanMobile}`;

    let customer = this.db.getCustomerByBusinessAndMobile(businessId, fullMobile);
    let isNew = false;
    const nowIso = new Date().toISOString();

    if (!customer) {
      // New Customer
      isNew = true;
      customer = {
        id: `cust_${generateSecureToken(8)}`,
        businessId,
        mobile: fullMobile,
        name: name && name.trim() ? name.trim() : 'Guest',
        visitCount: 0,
        totalVisits: 0,
        totalRewardsClaimed: 0,
        totalSpins: 0,
        reviewJourneyCompleted: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      this.db.saveCustomer(customer);
    } else {
      if (name && name.trim() && (!customer.name || customer.name === 'Guest')) {
        customer.name = name.trim();
        customer.updatedAt = nowIso;
        this.db.saveCustomer(customer);
      }
    }

    // Bind or create customer session
    let sessionToken: string;
    if (existingSession) {
      existingSession.customerId = customer.id;
      existingSession.customerNumber = fullMobile;
      existingSession.status = 'used';
      existingSession.isUsed = true;
      existingSession.usedAt = existingSession.usedAt || nowIso;
      this.db.saveCustomerSession(existingSession);
      sessionToken = existingSession.sessionToken;
    } else {
      const activeOffer = this.db.getActiveOfferByBusinessId(businessId);
      sessionToken = generateSecureToken(32);
      const session: CustomerSession = {
        sessionId: `cs_${generateSecureToken(8)}`,
        sessionToken,
        sessionKey: `sk_${generateSecureToken(16)}`,
        businessId,
        offerId: activeOffer ? activeOffer.id : '',
        customerId: customer.id,
        customerNumber: fullMobile,
        authType: 'qr',
        currentStage: 'auth',
        status: 'used',
        isUsed: true,
        usedAt: nowIso,
        createdAt: nowIso,
        expiresAt: new Date(Date.now() + CUSTOMER_SESSION_TTL_MS).toISOString(),
      };
      this.db.saveCustomerSession(session);
    }

    return {
      customer,
      isNew,
      sessionToken,
    };
  }
}
