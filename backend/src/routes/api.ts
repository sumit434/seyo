import express, { Request, Response } from 'express';
import { db } from '../config/db.js';
import { authenticateStaff, verifyStaffSession } from '../services/authService.js';
import { getBusinessById, getBusinessBySlug, listAllBusinesses, updateBusinessBranding } from '../services/businessService.js';
import { getCustomerById, getOrCreateCustomer } from '../services/customerService.js';
import { stampLoyaltyVisit } from '../services/loyaltyService.js';
import { createDynamicQR, getQRByKey, validateAndLockQR } from '../services/qrService.js';
import { redeemRewardWithPin } from '../services/rewardService.js';
import { generateAIReviewSuggestions, logGoogleOpened, persistReview } from '../services/reviewService.js';
import { computeCustomerStatus } from '../services/statusService.js';
import { executeSpin } from '../services/spinService.js';
import {
  getActiveOffer,
  listOffersForBusiness,
  createDraftOffer,
  updateDraftOffer,
  activateOffer,
  cancelOffer,
  recordOfferMetric,
} from '../services/offerService.js';
import {
  generateOnboardingToken,
  validateOnboardingToken,
  completeOnboarding,
} from '../services/onboardingService.js';
import { validateCustomerIdentify, validateReviewSave, validateStaffLogin, validateStaffPin } from '../validation/index.js';

export const apiRouter = express.Router();

// Middleware for Staff Authentication
function requireStaffAuth(req: Request, res: Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.headers['x-staff-token'] as string);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Staff session token required.' });
  }

  const session = verifyStaffSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }

  (req as any).staffSession = session;
  next();
}

// -------------------------------------------------------------
// 1. BUSINESS ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/business', (req: Request, res: Response) => {
  const businesses = listAllBusinesses();
  res.json({ success: true, businesses });
});

apiRouter.get('/business/:slug', (req: Request, res: Response) => {
  const business = getBusinessBySlug(req.params.slug);
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  const { passwordHash, staffPinHash, ...safeBusiness } = business;
  res.json({ success: true, business: safeBusiness });
});

// -------------------------------------------------------------
// 2. CUSTOMER & IDENTIFICATION ENDPOINTS
// -------------------------------------------------------------
apiRouter.post('/customer/identify', (req: Request, res: Response) => {
  const { slug, qrKey } = req.body;
  if (!slug) {
    return res.status(400).json({ error: 'Business slug is required.' });
  }

  const business = getBusinessBySlug(slug);
  if (!business) {
    return res.status(404).json({ error: 'Business not found.' });
  }

  const validation = validateCustomerIdentify(req.body);
  if (!validation.valid || !validation.data) {
    return res.status(400).json({ error: validation.error });
  }

  const { mobile, name } = validation.data;
  const customer = getOrCreateCustomer(business.id, mobile, name);
  recordOfferMetric(business.id, 'identifiedGuests');

  // If dynamic QR key provided, validate and lock
  let qrLockResult = null;
  if (qrKey && typeof qrKey === 'string' && qrKey.trim()) {
    qrLockResult = validateAndLockQR(qrKey.trim(), business.id, customer.id);
    if (!qrLockResult.valid) {
      return res.status(qrLockResult.statusCode || 400).json({
        error: qrLockResult.error,
        code: 'QR_LOCK_FAILED',
      });
    }
  }

  const status = computeCustomerStatus(business, customer);
  const { passwordHash, staffPinHash, ...safeBusiness } = business;

  res.json({
    success: true,
    customer,
    status,
    business: safeBusiness,
    qrLocked: !!qrLockResult?.valid,
  });
});

apiRouter.get('/customer/status/:slug/:customerId', (req: Request, res: Response) => {
  const { slug, customerId } = req.params;
  const business = getBusinessBySlug(slug);
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  const customer = getCustomerById(business.id, customerId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer record not found for this establishment' });
  }

  const status = computeCustomerStatus(business, customer);
  const { passwordHash, staffPinHash, ...safeBusiness } = business;

  res.json({
    success: true,
    status,
    customer,
    business: safeBusiness,
  });
});

// -------------------------------------------------------------
// 3. DYNAMIC QR ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/qr/info/:key', (req: Request, res: Response) => {
  const qr = getQRByKey(req.params.key);
  if (!qr) {
    return res.status(404).json({ error: 'QR token not found or has expired.' });
  }

  const business = getBusinessById(qr.businessId);
  if (business) {
    recordOfferMetric(business.id, 'scans');
  }

  res.json({
    success: true,
    qr: {
      key: qr.key,
      type: qr.type,
      isUsed: qr.isUsed,
      expiresAt: qr.expiresAt,
      businessSlug: business?.slug,
      businessName: business?.name,
    },
  });
});

apiRouter.post('/qr/lock', (req: Request, res: Response) => {
  const { key, businessId, customerId } = req.body;
  if (!key || !businessId || !customerId) {
    return res.status(400).json({ error: 'key, businessId, and customerId are required.' });
  }

  const result = validateAndLockQR(key, businessId, customerId);
  if (!result.valid) {
    return res.status(result.statusCode || 400).json({ error: result.error });
  }

  res.json({ success: true, message: 'QR successfully locked to customer session.' });
});

// -------------------------------------------------------------
// 4. SPIN & WIN ENDPOINTS
// -------------------------------------------------------------
apiRouter.post('/spin', (req: Request, res: Response) => {
  const { businessId, customerId } = req.body;
  if (!businessId || !customerId) {
    return res.status(400).json({ error: 'businessId and customerId are required' });
  }

  const result = executeSpin(businessId, customerId);
  if (!result.success) {
    return res.status(result.statusCode).json({ error: result.message, cooldown: (result as any).cooldown });
  }

  const business = getBusinessById(businessId)!;
  const customer = getCustomerById(businessId, customerId)!;
  const status = computeCustomerStatus(business, customer);

  res.json({
    success: true,
    winningSlice: result.winningSlice,
    sliceIndex: result.sliceIndex,
    reward: result.reward,
    status,
  });
});

// -------------------------------------------------------------
// 5. DIGITAL LOYALTY ENDPOINTS
// -------------------------------------------------------------
apiRouter.post('/loyalty/stamp', (req: Request, res: Response) => {
  const { businessId, customerId } = req.body;
  if (!businessId || !customerId) {
    return res.status(400).json({ error: 'businessId and customerId are required' });
  }

  const result = stampLoyaltyVisit(businessId, customerId);
  if (!result.success) {
    return res.status(result.statusCode).json({ error: result.message, cooldown: (result as any).cooldown });
  }

  const business = getBusinessById(businessId)!;
  const customer = getCustomerById(businessId, customerId)!;
  const status = computeCustomerStatus(business, customer);

  res.json({
    success: true,
    visitCount: result.visitCount,
    totalVisits: result.totalVisits,
    milestoneReached: result.milestoneReached,
    reward: result.reward,
    status,
  });
});

// -------------------------------------------------------------
// 6. VOUCHER & STAFF PIN REDEMPTION
// -------------------------------------------------------------
apiRouter.post('/reward/redeem', (req: Request, res: Response) => {
  const { businessId, customerId } = req.body;
  if (!businessId || !customerId) {
    return res.status(400).json({ error: 'businessId and customerId are required' });
  }

  const pinValidation = validateStaffPin(req.body);
  if (!pinValidation.valid || !pinValidation.data) {
    return res.status(400).json({ error: pinValidation.error });
  }

  const { pin, voucherCode } = pinValidation.data;
  if (!voucherCode) {
    return res.status(400).json({ error: 'Voucher code is required for redemption.' });
  }

  const result = redeemRewardWithPin(businessId, customerId, voucherCode, pin);
  if (!result.success) {
    return res.status(result.statusCode).json({ error: result.message });
  }

  const business = getBusinessById(businessId)!;
  const customer = getCustomerById(businessId, customerId)!;
  const status = computeCustomerStatus(business, customer);

  res.json({
    success: true,
    message: result.message,
    reward: result.reward,
    status,
  });
});

// -------------------------------------------------------------
// 7. REVIEW BOOSTER ENDPOINTS
// -------------------------------------------------------------
apiRouter.post('/review/generate', async (req: Request, res: Response) => {
  const { businessId, rating, tags, note } = req.body;
  const business = getBusinessById(businessId);
  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  try {
    const suggestions = await generateAIReviewSuggestions(
      business.name,
      business.category,
      Number(rating) || 5,
      Array.isArray(tags) ? tags : [],
      typeof note === 'string' ? note : ''
    );
    res.json({ success: true, suggestions });
  } catch {
    res.status(500).json({ error: 'Failed to generate review suggestions' });
  }
});

apiRouter.post('/review/persist', (req: Request, res: Response) => {
  const { businessId, customerId } = req.body;
  if (!businessId || !customerId) {
    return res.status(400).json({ error: 'businessId and customerId are required' });
  }

  const validation = validateReviewSave(req.body);
  if (!validation.valid || !validation.data) {
    return res.status(400).json({ error: validation.error });
  }

  const { reviewText, rating, tags } = validation.data;
  const result = persistReview(businessId, customerId, reviewText, rating, tags);

  if (!result.success) {
    return res.status(result.statusCode).json({ error: result.message });
  }

  const business = getBusinessById(businessId)!;
  const customer = getCustomerById(businessId, customerId)!;
  const status = computeCustomerStatus(business, customer);

  res.json({
    success: true,
    message: result.message,
    reviewLog: result.reviewLog,
    googleReviewUrl: result.googleReviewUrl,
    status,
  });
});

apiRouter.post('/review/opened', (req: Request, res: Response) => {
  const { reviewId } = req.body;
  if (reviewId) {
    logGoogleOpened(reviewId);
  }
  res.json({ success: true });
});

// -------------------------------------------------------------
// 8. STAFF PORTAL ENDPOINTS
// -------------------------------------------------------------
apiRouter.post('/staff/login', (req: Request, res: Response) => {
  const validation = validateStaffLogin(req.body);
  if (!validation.valid || !validation.data) {
    return res.status(400).json({ error: validation.error });
  }

  const { email, password } = validation.data;
  const authResult = authenticateStaff(email, password);

  if (!authResult.success) {
    return res.status(401).json({ error: authResult.message });
  }

  res.json(authResult);
});

apiRouter.get('/staff/terminal-data', requireStaffAuth, (req: Request, res: Response) => {
  const session = (req as any).staffSession;
  const business = getBusinessById(session.businessId);

  if (!business) {
    return res.status(404).json({ error: 'Business not found' });
  }

  // Scoped metrics: calculate customers, rewards redeemed, review logs for THIS business only!
  const businessCustomers = Array.from(db.customers.values()).filter(c => c.businessId === business.id);
  const businessRewards = Array.from(db.rewards.values()).filter(r => r.businessId === business.id);
  const businessReviews = Array.from(db.reviewLogs.values()).filter(r => r.businessId === business.id);

  const activeOffer = getActiveOffer(business.id);
  const allOffers = listOffersForBusiness(business.id);

  const { passwordHash, staffPinHash, ...safeBusiness } = business;

  res.json({
    success: true,
    business: safeBusiness,
    activeOffer,
    offers: allOffers,
    stats: {
      totalCustomers: businessCustomers.length,
      totalRewardsRedeemed: businessRewards.filter(r => r.status === 'redeemed').length,
      activeVouchersWaiting: businessRewards.filter(r => r.status === 'active').length,
      totalReviewsPersisted: businessReviews.length,
      // Tracker metrics from active offer
      activeOfferScans: activeOffer?.metrics?.scans || 0,
      activeOfferIdentified: activeOffer?.metrics?.identifiedGuests || 0,
      activeOfferRewardsIssued: activeOffer?.metrics?.rewardsIssued || 0,
      activeOfferRewardsRedeemed: activeOffer?.metrics?.rewardsRedeemed || 0,
      activeOfferReviewsPersisted: activeOffer?.metrics?.reviewsPersisted || 0,
    },
    recentRewards: businessRewards.slice(-10).reverse(),
    recentReviews: businessReviews.slice(-10).reverse(),
  });
});

apiRouter.post('/staff/generate-qr', requireStaffAuth, (req: Request, res: Response) => {
  const session = (req as any).staffSession;
  const { type, ttlMinutes } = req.body;

  const validTypes = ['spin', 'loyalty', 'combined'];
  const qrType = validTypes.includes(type) ? type : 'combined';

  const qr = createDynamicQR(session.businessId, qrType, Number(ttlMinutes) || 15);
  const business = getBusinessById(session.businessId)!;

  res.json({
    success: true,
    qr,
    targetUrl: `/c/${business.slug}/${qrType === 'combined' ? 'v' : qrType}?key=${qr.key}`,
  });
});

// -------------------------------------------------------------
// 9. POST-PAYMENT ONBOARDING ENDPOINTS
// -------------------------------------------------------------
apiRouter.post('/onboarding/generate-token', (req: Request, res: Response) => {
  const { email, tier, businessName } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid merchant subscription email is required.' });
  }

  const validTiers = ['combined', 'spin', 'loyalty', 'review'];
  const selectedTier = validTiers.includes(tier) ? tier : 'combined';

  const tokenRecord = generateOnboardingToken(email, selectedTier as any, businessName);

  res.json({
    success: true,
    token: tokenRecord.token,
    onboardingUrl: `/onboarding/${tokenRecord.token}`,
    expiresAt: tokenRecord.expiresAt,
    tier: tokenRecord.tier,
    message: 'Onboarding magic link generated with 15-minute security TTL.',
  });
});

apiRouter.get('/onboarding/validate/:token', (req: Request, res: Response) => {
  const result = validateOnboardingToken(req.params.token);
  if (!result.valid) {
    return res.status(result.statusCode).json({ error: result.error });
  }

  res.json({
    success: true,
    tokenData: {
      email: result.tokenData?.email,
      tier: result.tokenData?.tier,
      businessName: result.tokenData?.businessName,
      expiresAt: result.tokenData?.expiresAt,
    },
  });
});

apiRouter.post('/onboarding/complete', (req: Request, res: Response) => {
  const { token, ...businessData } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Onboarding token is required.' });
  }

  const result = completeOnboarding(token, businessData);
  if (!result.success) {
    return res.status(result.statusCode).json({ error: result.error });
  }

  res.status(201).json({
    success: true,
    message: 'Merchant business onboarded and initialized successfully!',
    business: result.business,
    sessionToken: result.sessionToken,
  });
});

// -------------------------------------------------------------
// 10. OFFER LIFECYCLE & IMMUTABILITY ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/offers/current/:businessId', (req: Request, res: Response) => {
  const { businessId } = req.params;
  const activeOffer = getActiveOffer(businessId);
  const allOffers = listOffersForBusiness(businessId);

  res.json({
    success: true,
    activeOffer,
    offers: allOffers,
  });
});

apiRouter.post('/offers/draft', requireStaffAuth, (req: Request, res: Response) => {
  const session = (req as any).staffSession;
  const result = createDraftOffer(session.businessId, req.body);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.status(201).json({
    success: true,
    offer: result.offer,
    message: 'Draft offer created successfully.',
  });
});

apiRouter.put('/offers/:id', requireStaffAuth, (req: Request, res: Response) => {
  const session = (req as any).staffSession;
  const result = updateDraftOffer(session.businessId, req.params.id, req.body);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    success: true,
    offer: result.offer,
    message: 'Offer draft updated successfully.',
  });
});

apiRouter.post('/offers/activate', requireStaffAuth, (req: Request, res: Response) => {
  const session = (req as any).staffSession;
  const { offerId, confirmImmutability } = req.body;

  if (!offerId) {
    return res.status(400).json({ error: 'offerId is required.' });
  }

  if (confirmImmutability !== true) {
    return res.status(400).json({
      error: 'IMMUTABILITY_CONFIRMATION_REQUIRED: You must explicitly acknowledge that this offer configuration cannot be edited once active.',
    });
  }

  const result = activateOffer(session.businessId, offerId, confirmImmutability);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    success: true,
    offer: result.offer,
    message: 'Offer successfully locked and activated! Slices and reward settings are now live.',
  });
});

apiRouter.post('/offers/cancel', requireStaffAuth, (req: Request, res: Response) => {
  const session = (req as any).staffSession;
  const { offerId } = req.body;

  if (!offerId) {
    return res.status(400).json({ error: 'offerId is required.' });
  }

  const result = cancelOffer(session.businessId, offerId);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    success: true,
    offer: result.offer,
    message: 'Offer campaign has been cancelled.',
  });
});

// -------------------------------------------------------------
// 11. BRANDING & LOGO UPLOAD ENDPOINT
// -------------------------------------------------------------
apiRouter.post('/business/:id/branding', requireStaffAuth, (req: Request, res: Response) => {
  const session = (req as any).staffSession;
  if (session.businessId !== req.params.id) {
    return res.status(403).json({ error: 'Unauthorized to update branding for this establishment.' });
  }

  const { logoUrl, logoEmoji, accentColor, address } = req.body;

  // Validate base64 payload size if image provided
  if (logoUrl && typeof logoUrl === 'string' && logoUrl.length > 3 * 1024 * 1024) {
    return res.status(400).json({ error: 'Uploaded logo exceeds maximum size limit (2MB).' });
  }

  const updated = updateBusinessBranding(req.params.id, { logoUrl, logoEmoji, accentColor, address });
  if (!updated) {
    return res.status(404).json({ error: 'Business not found.' });
  }

  const { passwordHash, staffPinHash, ...safeBusiness } = updated;
  res.json({
    success: true,
    business: safeBusiness,
    message: 'Business branding updated successfully.',
  });
});

