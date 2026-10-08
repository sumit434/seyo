import fs from 'fs';
import path from 'path';
import { Business } from '../../../shared/types/business';
import { Offer } from '../../../shared/types/offer';
import { Customer } from '../../../shared/types/customer';
import { Reward } from '../../../shared/types/reward';
import { ReviewLog } from '../../../shared/types/review';
import { MerchantEntry, CustomerSession } from '../../../shared/types/qr';
import { OnboardingToken, OnboardingSession } from '../../../shared/types/onboarding';
import { StaffSession } from '../../../shared/types/session';
import { PaymentRecord } from '../../../shared/types/payment';
import { createInitialSeedData } from './seed';
import { hashPin, verifyPin, generateSecureToken, normalizePhone } from '../utils/crypto';
import { QR_SESSION_KEY_TTL_MS } from '../../../shared/constants/limits';

const DB_FILE_PATH = path.resolve(process.cwd(), '.seyo_db_store.json');

export class MemoryDB {
  private static instance: MemoryDB;

  private businesses: Map<string, Business> = new Map();
  private offers: Map<string, Offer> = new Map();
  private customers: Map<string, Customer> = new Map(); // id -> Customer
  private customerLookup: Map<string, string> = new Map(); // businessId:mobile -> customerId
  private rewards: Map<string, Reward> = new Map();
  private reviewLogs: Map<string, ReviewLog> = new Map();
  private merchantEntries: Map<string, MerchantEntry> = new Map(); // id -> MerchantEntry
  private merchantEntryCodeLookup: Map<string, string> = new Map(); // permanentCode -> id
  private customerSessions: Map<string, CustomerSession> = new Map(); // sessionToken -> CustomerSession
  private sessionKeyLookup: Map<string, string> = new Map(); // sessionKey -> sessionToken
  private onboardingTokens: Map<string, OnboardingToken> = new Map(); // tokenHash -> OnboardingToken
  private onboardingSessions: Map<string, OnboardingSession> = new Map(); // sessionId -> OnboardingSession
  private staffSessions: Map<string, StaffSession> = new Map(); // sessionId -> StaffSession
  private payments: Map<string, PaymentRecord> = new Map(); // id -> PaymentRecord
  private paymentOrderLookup: Map<string, string> = new Map(); // razorpayOrderId -> id

  private saveTimeout: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.init();
  }

  public static getInstance(): MemoryDB {
    if (!MemoryDB.instance) {
      MemoryDB.instance = new MemoryDB();
    }
    return MemoryDB.instance;
  }

  private init() {
    this.loadFromDisk();

    // Start background TTL cleaner every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.runTtlCleanup();
    }, 60 * 1000);
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const data = JSON.parse(raw);
        if (data.businesses && Array.isArray(data.businesses)) {
          data.businesses.forEach((b: Business) => {
            if (b.staffPinHash && b.staffPinHash.split(':').length < 5) {
              if (verifyPin('7788', b.staffPinHash)) {
                b.staffPinHash = hashPin('7788');
              }
            }
            this.businesses.set(b.id, b);
          });
        }
        if (data.offers && Array.isArray(data.offers)) {
          data.offers.forEach((o: Offer) => this.offers.set(o.id, o));
        }
        if (data.customers && Array.isArray(data.customers)) {
          data.customers.forEach((c: Customer) => {
            this.customers.set(c.id, c);
            this.customerLookup.set(`${c.businessId}:${c.mobile}`, c.id);
          });
        }
        if (data.rewards && Array.isArray(data.rewards)) {
          data.rewards.forEach((r: Reward) => this.rewards.set(r.id, r));
        }
        if (data.reviewLogs && Array.isArray(data.reviewLogs)) {
          data.reviewLogs.forEach((rv: ReviewLog) => this.reviewLogs.set(rv.id, rv));
        }
        if (data.merchantEntries && Array.isArray(data.merchantEntries)) {
          data.merchantEntries.forEach((m: MerchantEntry) => {
            this.merchantEntries.set(m.id, m);
            this.merchantEntryCodeLookup.set(m.permanentCode, m.id);
          });
        }
        if (data.customerSessions && Array.isArray(data.customerSessions)) {
          data.customerSessions.forEach((cs: CustomerSession) => {
            this.customerSessions.set(cs.sessionToken, cs);
            if (cs.sessionKey) {
              this.sessionKeyLookup.set(cs.sessionKey, cs.sessionToken);
            }
          });
        }
        if (data.onboardingTokens && Array.isArray(data.onboardingTokens)) {
          data.onboardingTokens.forEach((ot: OnboardingToken) => this.onboardingTokens.set(ot.tokenHash, ot));
        }
        if (data.onboardingSessions && Array.isArray(data.onboardingSessions)) {
          data.onboardingSessions.forEach((os: OnboardingSession) => this.onboardingSessions.set(os.sessionId, os));
        }
        if (data.staffSessions && Array.isArray(data.staffSessions)) {
          data.staffSessions.forEach((ss: StaffSession) => this.staffSessions.set(ss.sessionId, ss));
        }
        if (data.payments && Array.isArray(data.payments)) {
          data.payments.forEach((p: PaymentRecord) => {
            this.payments.set(p.id, p);
            if (p.razorpayOrderId) {
              this.paymentOrderLookup.set(p.razorpayOrderId, p.id);
            }
          });
        }
        return;
      }
    } catch (err) {
      console.error('Error loading .seyo_db_store.json, creating initial seed data...', err);
    }

    // Seed initial data if empty
    this.seed();
  }

  private seed() {
    const seedData = createInitialSeedData();
    seedData.businesses.forEach(b => this.businesses.set(b.id, b));
    seedData.offers.forEach(o => this.offers.set(o.id, o));
    seedData.merchantEntries.forEach(m => {
      this.merchantEntries.set(m.id, m);
      this.merchantEntryCodeLookup.set(m.permanentCode, m.id);
    });
    seedData.customers.forEach(c => {
      this.customers.set(c.id, c);
      this.customerLookup.set(`${c.businessId}:${c.mobile}`, c.id);
    });
    seedData.rewards.forEach(r => this.rewards.set(r.id, r));
    seedData.reviewLogs.forEach(rv => this.reviewLogs.set(rv.id, rv));

    this.saveImmediate();
  }

  public scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate();
    }, 150);
  }

  public saveImmediate() {
    try {
      const dump = {
        savedAt: new Date().toISOString(),
        businesses: Array.from(this.businesses.values()),
        offers: Array.from(this.offers.values()),
        customers: Array.from(this.customers.values()),
        rewards: Array.from(this.rewards.values()),
        reviewLogs: Array.from(this.reviewLogs.values()),
        merchantEntries: Array.from(this.merchantEntries.values()),
        customerSessions: Array.from(this.customerSessions.values()),
        onboardingTokens: Array.from(this.onboardingTokens.values()),
        onboardingSessions: Array.from(this.onboardingSessions.values()),
        staffSessions: Array.from(this.staffSessions.values()),
        payments: Array.from(this.payments.values()),
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dump, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving .seyo_db_store.json:', err);
    }
  }

  public runTtlCleanup() {
    const now = new Date().toISOString();

    // Expire customer sessions
    for (const [token, session] of this.customerSessions.entries()) {
      if (session.expiresAt < now) {
        this.customerSessions.delete(token);
      }
    }

    // Expire onboarding tokens
    for (const [hash, ot] of this.onboardingTokens.entries()) {
      if (ot.status === 'pending' && ot.expiresAt < now) {
        ot.status = 'expired';
      }
    }

    // Expire staff sessions
    for (const [id, session] of this.staffSessions.entries()) {
      if (session.expiresAt < now) {
        this.staffSessions.delete(id);
      }
    }

    this.scheduleSave();
  }

  // --- BUSINESS REPOSITORY METHODS ---
  public getBusinessById(id: string): Business | undefined {
    return this.businesses.get(id);
  }

  public getBusinessBySlug(slug: string): Business | undefined {
    for (const b of this.businesses.values()) {
      if (b.slug.toLowerCase() === slug.toLowerCase()) return b;
    }
    return undefined;
  }

  public getBusinessByEmail(email: string): Business | undefined {
    for (const b of this.businesses.values()) {
      if (b.email.toLowerCase() === email.toLowerCase()) return b;
    }
    return undefined;
  }

  public getAllBusinesses(): Business[] {
    return Array.from(this.businesses.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  public saveBusiness(business: Business): Business {
    this.businesses.set(business.id, business);
    this.scheduleSave();
    return business;
  }

  // --- OFFER REPOSITORY METHODS ---
  public getOfferById(id: string): Offer | undefined {
    return this.offers.get(id);
  }

  public getActiveOfferByBusinessId(businessId: string): Offer | undefined {
    for (const offer of this.offers.values()) {
      if (offer.businessId === businessId && offer.status === 'active') {
        return offer;
      }
    }
    return undefined;
  }

  public getOffersByBusinessId(businessId: string): Offer[] {
    return Array.from(this.offers.values()).filter(o => o.businessId === businessId);
  }

  public saveOffer(offer: Offer): Offer {
    this.offers.set(offer.id, offer);
    this.scheduleSave();
    return offer;
  }

  // --- MERCHANT ENTRY REPOSITORY METHODS ---
  public getMerchantEntryByPermanentCode(code: string): MerchantEntry | undefined {
    const id = this.merchantEntryCodeLookup.get(code);
    return id ? this.merchantEntries.get(id) : undefined;
  }

  public getMerchantEntriesByBusinessId(businessId: string): MerchantEntry[] {
    return Array.from(this.merchantEntries.values()).filter(m => m.businessId === businessId);
  }

  public saveMerchantEntry(entry: MerchantEntry): MerchantEntry {
    this.merchantEntries.set(entry.id, entry);
    this.merchantEntryCodeLookup.set(entry.permanentCode, entry.id);
    this.scheduleSave();
    return entry;
  }

  // --- CUSTOMER REPOSITORY METHODS ---
  public getCustomerById(id: string): Customer | undefined {
    return this.customers.get(id);
  }

  public getCustomerByBusinessAndMobile(businessId: string, mobile: string): Customer | undefined {
    const id = this.customerLookup.get(`${businessId}:${mobile}`);
    return id ? this.customers.get(id) : undefined;
  }

  public getCustomersByBusinessId(businessId: string): Customer[] {
    return Array.from(this.customers.values()).filter(c => c.businessId === businessId);
  }

  public saveCustomer(customer: Customer): Customer {
    this.customers.set(customer.id, customer);
    this.customerLookup.set(`${customer.businessId}:${customer.mobile}`, customer.id);
    this.scheduleSave();
    return customer;
  }

  // --- CUSTOMER SESSION REPOSITORY METHODS ---
  public getCustomerSession(tokenOrKey: string): CustomerSession | undefined {
    let session = this.customerSessions.get(tokenOrKey);
    if (!session) {
      const token = this.sessionKeyLookup.get(tokenOrKey);
      if (token) {
        session = this.customerSessions.get(token);
      }
    }
    if (!session) return undefined;
    if (session.expiresAt < new Date().toISOString()) {
      this.deleteCustomerSession(session.sessionToken);
      return undefined;
    }
    return session;
  }

  public getCustomerSessionByKey(sessionKey: string): CustomerSession | undefined {
    const token = this.sessionKeyLookup.get(sessionKey);
    if (token) {
      return this.getCustomerSession(token);
    }
    for (const s of this.customerSessions.values()) {
      if (s.sessionKey === sessionKey) {
        return this.getCustomerSession(s.sessionToken);
      }
    }
    return undefined;
  }

  public saveCustomerSession(session: CustomerSession): CustomerSession {
    this.customerSessions.set(session.sessionToken, session);
    if (session.sessionKey) {
      this.sessionKeyLookup.set(session.sessionKey, session.sessionToken);
    }
    this.scheduleSave();
    return session;
  }

  public deleteCustomerSession(token: string): void {
    const session = this.customerSessions.get(token);
    if (session?.sessionKey) {
      this.sessionKeyLookup.delete(session.sessionKey);
    }
    this.customerSessions.delete(token);
    this.scheduleSave();
  }

  public getActiveQrSessionForBusiness(businessId: string): CustomerSession | undefined {
    const nowIso = new Date().toISOString();
    for (const s of this.customerSessions.values()) {
      if (
        s.businessId === businessId &&
        s.authType === 'qr' &&
        s.status === 'unused' &&
        s.expiresAt > nowIso
      ) {
        return s;
      }
    }
    return undefined;
  }

  public invalidateUnusedQrSessions(businessId: string): void {
    const nowIso = new Date().toISOString();
    for (const s of this.customerSessions.values()) {
      if (s.businessId === businessId && s.authType === 'qr' && s.status === 'unused') {
        s.status = 'expired';
        s.expiresAt = nowIso;
      }
    }
    this.scheduleSave();
  }

  public createQrSession(businessId: string, offerId: string): CustomerSession {
    const sessionToken = generateSecureToken(32);
    const sessionKey = `sk_${generateSecureToken(16)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + QR_SESSION_KEY_TTL_MS).toISOString();

    const sessionId = `cs_${generateSecureToken(8)}`;
    const session: CustomerSession = {
      id: sessionId,
      sessionId,
      sessionToken,
      sessionKey,
      businessId,
      offerId,
      authType: 'qr',
      source: 'qr',
      entryType: 'combined',
      qrKey: sessionKey,
      currentStage: 'auth',
      status: 'unused',
      isUsed: false,
      createdAt: now.toISOString(),
      expiresAt,
    };

    return this.saveCustomerSession(session);
  }

  public claimSessionKey(
    sessionKeyOrToken: string,
    customerNumber: string,
    customerId?: string
  ): { success: boolean; session?: CustomerSession; reason?: string } {
    const session = this.getCustomerSession(sessionKeyOrToken);
    if (!session) {
      return { success: false, reason: 'INVALID_SESSION' };
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      return { success: false, reason: 'SESSION_EXPIRED' };
    }

    if (session.status === 'completed') {
      return { success: false, reason: 'ALREADY_USED' };
    }

    const cleanInputPhone = normalizePhone(customerNumber);
    const cleanSessionPhone = normalizePhone(session.customerNumber || '');

    if (session.status === 'used') {
      if (cleanSessionPhone && cleanSessionPhone !== cleanInputPhone) {
        return { success: false, reason: 'ALREADY_USED' };
      }
      if (customerId && !session.customerId) {
        session.customerId = customerId;
        this.saveCustomerSession(session);
      }
      return { success: true, session };
    }

    // Atomic claim of 'unused' session
    session.customerNumber = customerNumber;
    if (customerId) session.customerId = customerId;
    session.status = 'used';
    session.isUsed = true;
    session.usedAt = new Date().toISOString();
    this.saveCustomerSession(session);

    return { success: true, session };
  }

  public markSessionClaimCompleted(sessionTokenOrKey: string): void {
    const session = this.getCustomerSession(sessionTokenOrKey);
    if (session && session.status !== 'completed') {
      session.status = 'completed';
      session.completedAt = new Date().toISOString();
      this.saveCustomerSession(session);
    }
  }

  // --- REWARD REPOSITORY METHODS ---
  public getRewardById(id: string): Reward | undefined {
    return this.rewards.get(id);
  }

  public getRewardsByBusinessId(businessId: string): Reward[] {
    return Array.from(this.rewards.values())
      .filter(r => r.businessId === businessId)
      .sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());
  }

  public getRewardByCodeAndBusiness(code: string, businessId: string): Reward | undefined {
    for (const r of this.rewards.values()) {
      if (r.businessId === businessId && r.code.toUpperCase() === code.toUpperCase()) {
        return r;
      }
    }
    return undefined;
  }

  public saveReward(reward: Reward): Reward {
    this.rewards.set(reward.id, reward);
    this.scheduleSave();
    return reward;
  }

  // --- REVIEW LOG REPOSITORY METHODS ---
  public getReviewLogsByBusinessId(businessId: string): ReviewLog[] {
    return Array.from(this.reviewLogs.values())
      .filter(rv => rv.businessId === businessId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public saveReviewLog(log: ReviewLog): ReviewLog {
    this.reviewLogs.set(log.id, log);
    this.scheduleSave();
    return log;
  }

  // --- ONBOARDING TOKEN & SESSION REPOSITORY METHODS ---
  public getOnboardingTokenByHash(hash: string): OnboardingToken | undefined {
    return this.onboardingTokens.get(hash);
  }

  public getOnboardingTokenById(id: string): OnboardingToken | undefined {
    for (const ot of this.onboardingTokens.values()) {
      if (ot.id === id) return ot;
    }
    return undefined;
  }

  public saveOnboardingToken(token: OnboardingToken): OnboardingToken {
    this.onboardingTokens.set(token.tokenHash, token);
    this.scheduleSave();
    return token;
  }

  public getOnboardingSession(sessionId: string): OnboardingSession | undefined {
    const session = this.onboardingSessions.get(sessionId);
    if (!session) return undefined;
    if (session.expiresAt < new Date().toISOString()) {
      this.onboardingSessions.delete(sessionId);
      this.scheduleSave();
      return undefined;
    }
    return session;
  }

  public saveOnboardingSession(session: OnboardingSession): OnboardingSession {
    this.onboardingSessions.set(session.sessionId, session);
    this.scheduleSave();
    return session;
  }

  // --- STAFF SESSION REPOSITORY METHODS ---
  public getStaffSession(sessionId: string): StaffSession | undefined {
    const session = this.staffSessions.get(sessionId);
    if (!session) return undefined;
    if (session.expiresAt < new Date().toISOString()) {
      this.staffSessions.delete(sessionId);
      this.scheduleSave();
      return undefined;
    }
    return session;
  }

  public saveStaffSession(session: StaffSession): StaffSession {
    this.staffSessions.set(session.sessionId, session);
    this.scheduleSave();
    return session;
  }

  public deleteStaffSession(sessionId: string): void {
    this.staffSessions.delete(sessionId);
    this.scheduleSave();
  }

  // --- PAYMENT REPOSITORY METHODS ---
  public getPaymentById(id: string): PaymentRecord | undefined {
    return this.payments.get(id);
  }

  public getPaymentByOrderId(orderId: string): PaymentRecord | undefined {
    const id = this.paymentOrderLookup.get(orderId);
    return id ? this.payments.get(id) : undefined;
  }

  public savePayment(payment: PaymentRecord): PaymentRecord {
    this.payments.set(payment.id, payment);
    if (payment.razorpayOrderId) {
      this.paymentOrderLookup.set(payment.razorpayOrderId, payment.id);
    }
    this.scheduleSave();
    return payment;
  }
}
