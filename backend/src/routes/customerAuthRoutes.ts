import { Router, Request, Response } from 'express';
import { CustomerAuthService } from '../services/customerAuthService';
import { CustomerStatusService } from '../services/customerStatusService';
import { MemoryDB } from '../db/MemoryDB';
import { normalizePhone } from '../utils/crypto';
import { getCountryPhoneLength } from '../../../shared/constants/countries';

const router = Router();
const authService = new CustomerAuthService();
const statusService = new CustomerStatusService();
const db = MemoryDB.getInstance();

// Request OTP
router.post(['/otp/request', '/customer/otp/request'], async (req: Request, res: Response, next) => {
  try {
    const { businessId, mobile, countryCode, sessionKey, sessionToken } = req.body;
    if (!businessId || !mobile) {
      return res.status(400).json({ success: false, message: 'businessId and mobile are required' });
    }

    const tokenOrKey = sessionKey || sessionToken || (req.headers['x-customer-session'] as string);
    if (!tokenOrKey) {
      return res.status(400).json({
        success: false,
        error: 'SESSION_REQUIRED',
        message: 'A valid QR or NFC session is required. Please scan the QR code.',
      });
    }

    const nationalDigits = String(mobile).replace(/\D/g, '');
    const expectedLen = getCountryPhoneLength(countryCode || '+1');
    if (nationalDigits.length !== expectedLen) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_MOBILE_LENGTH',
        message: `Mobile number must be exactly ${expectedLen} digits for ${countryCode || '+1'}.`,
      });
    }

    const cleanMobile = mobile.replace(/\s+/g, '');
    const fullMobile = cleanMobile.startsWith('+') ? cleanMobile : `${countryCode || '+1'}${cleanMobile}`;

    const session = db.getCustomerSession(tokenOrKey);
    if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
      return res.status(403).json({
        success: false,
        error: 'SESSION_EXPIRED',
        message: 'Token already used or expired',
      });
    }

    if (session.status === 'completed') {
      return res.status(403).json({
        success: false,
        error: 'SESSION_ALREADY_USED',
        message: 'Token already used or expired',
      });
    }

    if (session.status === 'used' && session.customerNumber) {
      const cleanSessionPhone = normalizePhone(session.customerNumber);
      const cleanReqPhone = normalizePhone(fullMobile);
      if (cleanSessionPhone && cleanSessionPhone !== cleanReqPhone) {
        return res.status(403).json({
          success: false,
          error: 'SESSION_ALREADY_USED',
          message: 'Token already used or expired',
        });
      }
    }

    const result = await authService.requestOtp(businessId, mobile, countryCode);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Direct Customer Entry (OTP completely removed from customer flow)
router.post(['/identify', '/customer/identify'], async (req: Request, res: Response, next) => {
  try {
    const { businessId, mobile, name, countryCode, sessionKey, sessionToken } = req.body;
    if (!businessId || !mobile) {
      return res.status(400).json({ success: false, message: 'businessId and mobile are required' });
    }

    const tokenOrKey = sessionKey || sessionToken || (req.headers['x-customer-session'] as string);
    if (!tokenOrKey) {
      return res.status(400).json({
        success: false,
        error: 'SESSION_REQUIRED',
        message: 'A valid QR or NFC session is required. Please scan the QR code.',
      });
    }

    const nationalDigits = String(mobile).replace(/\D/g, '');
    const expectedLen = getCountryPhoneLength(countryCode || '+1');
    if (nationalDigits.length !== expectedLen) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_MOBILE_LENGTH',
        message: `Mobile number must be exactly ${expectedLen} digits for ${countryCode || '+1'}.`,
      });
    }

    const cleanMobile = mobile.replace(/\s+/g, '');
    const fullMobile = cleanMobile.startsWith('+') ? cleanMobile : `${countryCode || '+1'}${cleanMobile}`;

    // Atomically claim or validate sessionKey
    const claimResult = db.claimSessionKey(tokenOrKey, fullMobile);
    if (!claimResult.success) {
      return res.status(403).json({
        success: false,
        error: claimResult.reason === 'SESSION_EXPIRED' ? 'SESSION_EXPIRED' : 'SESSION_ALREADY_USED',
        message: 'Token already used or expired',
      });
    }

    const session = claimResult.session!;

    const { customer, isNew, sessionToken: finalSessionToken } = await authService.identifyCustomer(
      businessId,
      mobile,
      name,
      countryCode,
      session
    );

    const business = db.getBusinessById(businessId);
    const offer = db.getActiveOfferByBusinessId(businessId);

    const statusPayload = statusService.formatStatusResponse(business!, offer || null, customer, session.entryType);

    res.json({
      success: true,
      sessionToken: finalSessionToken,
      sessionKey: session.sessionKey,
      isNew,
      ...statusPayload,
    });
  } catch (err) {
    next(err);
  }
});

// Verify OTP / Direct Auth Route
router.post(['/otp/verify', '/customer/otp/verify'], async (req: Request, res: Response, next) => {
  try {
    const { businessId, mobile, otp, name, countryCode, sessionKey, sessionToken } = req.body;
    if (!businessId || !mobile) {
      return res.status(400).json({ success: false, message: 'businessId and mobile are required' });
    }

    const tokenOrKey = sessionKey || sessionToken || (req.headers['x-customer-session'] as string);
    if (!tokenOrKey) {
      return res.status(400).json({
        success: false,
        error: 'SESSION_REQUIRED',
        message: 'A valid QR or NFC session is required. Please scan the QR code.',
      });
    }

    const nationalDigits = String(mobile).replace(/\D/g, '');
    const expectedLen = getCountryPhoneLength(countryCode || '+1');
    if (nationalDigits.length !== expectedLen) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_MOBILE_LENGTH',
        message: `Mobile number must be exactly ${expectedLen} digits for ${countryCode || '+1'}.`,
      });
    }

    const cleanMobile = mobile.replace(/\s+/g, '');
    const fullMobile = cleanMobile.startsWith('+') ? cleanMobile : `${countryCode || '+1'}${cleanMobile}`;

    // Atomically claim or validate sessionKey
    const claimResult = db.claimSessionKey(tokenOrKey, fullMobile);
    if (!claimResult.success) {
      return res.status(403).json({
        success: false,
        error: claimResult.reason === 'SESSION_EXPIRED' ? 'SESSION_EXPIRED' : 'SESSION_ALREADY_USED',
        message: 'Token already used or expired',
      });
    }

    const session = claimResult.session!;

    let customerResult;
    if (otp && otp.trim()) {
      customerResult = await authService.verifyOtp(
        businessId,
        mobile,
        otp,
        name,
        countryCode,
        session
      );
    } else {
      customerResult = await authService.identifyCustomer(
        businessId,
        mobile,
        name,
        countryCode,
        session
      );
    }

    const business = db.getBusinessById(businessId);
    const offer = db.getActiveOfferByBusinessId(businessId);

    const statusPayload = statusService.formatStatusResponse(business!, offer || null, customerResult.customer, session.entryType);

    res.json({
      success: true,
      sessionToken: customerResult.sessionToken,
      sessionKey: session.sessionKey,
      isNew: customerResult.isNew,
      ...statusPayload,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
