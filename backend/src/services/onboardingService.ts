import { db, IBusiness, IOnboardingToken, SpinWheelSlice } from '../config/db.js';
import { generateSecureKey } from '../utils/crypto.js';
import { hashPassword } from '../utils/password.js';
import { hashPin } from '../utils/pin.js';
import { activateOffer, createDraftOffer } from './offerService.js';

export function generateOnboardingToken(
  email: string,
  tier: 'combined' | 'spin' | 'loyalty' | 'review' = 'combined',
  businessName?: string
): IOnboardingToken {
  const token = `onb_${generateSecureKey(20)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15-minute TTL

  const onboardingToken: IOnboardingToken = {
    token,
    email: email.trim().toLowerCase(),
    tier,
    businessName: businessName?.trim() || undefined,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt,
    completedAt: null,
    businessId: null,
  };

  db.onboardingTokens.set(token, onboardingToken);
  db.saveToDisk();

  return onboardingToken;
}

export function validateOnboardingToken(token: string): {
  valid: boolean;
  statusCode: number;
  error?: string;
  tokenData?: IOnboardingToken;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, statusCode: 400, error: 'Onboarding token is required.' };
  }

  const tokenData = db.onboardingTokens.get(token);
  if (!tokenData) {
    return { valid: false, statusCode: 404, error: 'Invalid or non-existent onboarding magic link.' };
  }

  const now = new Date().toISOString();
  if (tokenData.expiresAt < now) {
    tokenData.status = 'expired';
    db.saveToDisk();
    return {
      valid: false,
      statusCode: 410,
      error: 'Onboarding magic link has expired (15-minute security TTL). Please request a fresh invitation link.',
    };
  }

  if (tokenData.status === 'completed') {
    return {
      valid: false,
      statusCode: 400,
      error: 'This onboarding magic link has already been used. Please log in to your Staff Terminal.',
    };
  }

  return { valid: true, statusCode: 200, tokenData };
}

export interface CompleteOnboardingData {
  name: string;
  category: string;
  address: string;
  timezone?: string;
  logoEmoji?: string;
  logoUrl?: string;
  accentColor?: string;
  googleReviewUrl?: string;
  googlePlaceId?: string;
  password: string;
  staffPin: string;
  loyaltyTarget?: number;
  loyaltyReward?: string;
  spinWheelConfiguration?: SpinWheelSlice[];
  offerDurationDays?: number;
}

export function completeOnboarding(
  token: string,
  data: CompleteOnboardingData
): {
  success: boolean;
  statusCode: number;
  error?: string;
  business?: any;
  sessionToken?: string;
} {
  const tokenValidation = validateOnboardingToken(token);
  if (!tokenValidation.valid || !tokenValidation.tokenData) {
    return {
      success: false,
      statusCode: tokenValidation.statusCode,
      error: tokenValidation.error,
    };
  }

  const tokenData = tokenValidation.tokenData;

  // Validation
  if (!data.name || !data.name.trim()) {
    return { success: false, statusCode: 400, error: 'Business name is required.' };
  }
  if (!data.category || !data.category.trim()) {
    return { success: false, statusCode: 400, error: 'Category is required.' };
  }
  if (!data.password || data.password.length < 6) {
    return { success: false, statusCode: 400, error: 'Password must be at least 6 characters.' };
  }
  if (!data.staffPin || !/^\d{4}$/.test(data.staffPin.trim())) {
    return { success: false, statusCode: 400, error: 'Staff PIN must be exactly 4 digits.' };
  }

  // Generate unique slug
  let baseSlug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  if (!baseSlug) baseSlug = 'merchant';

  let slug = baseSlug;
  let counter = 1;
  const existingSlugs = new Set(Array.from(db.businesses.values()).map(b => b.slug.toLowerCase()));
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const businessId = `biz_${generateSecureKey(10)}`;

  // Default spin wheel slices if needed
  const defaultSpinSlices: SpinWheelSlice[] = [
    { id: 'sw_1', rewardLabel: '20% Off Bill', emoji: '🎟️', weight: 35 },
    { id: 'sw_2', rewardLabel: 'Free Welcome Treat', emoji: '🧁', weight: 35 },
    { id: 'sw_3', rewardLabel: 'Specialty Upgrade', emoji: '✨', weight: 20 },
    { id: 'sw_4', rewardLabel: 'VIP Surprise Prize', emoji: '🎁', weight: 10 },
  ];

  const spinSlices = (data.spinWheelConfiguration && data.spinWheelConfiguration.length >= 2)
    ? data.spinWheelConfiguration
    : defaultSpinSlices;

  // Validate spin weights if tier has spin
  if (tokenData.tier === 'spin' || tokenData.tier === 'combined') {
    const totalWeight = spinSlices.reduce((sum, s) => sum + (Number(s.weight) || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return { success: false, statusCode: 400, error: `Spin wheel slice weights must equal 100%. Current sum: ${totalWeight}%` };
    }
  }

  const loyaltyTarget = Math.max(1, Number(data.loyaltyTarget) || 5);
  const loyaltyReward = data.loyaltyReward?.trim() || 'Complimentary Signature Item';

  const newBusiness: IBusiness = {
    id: businessId,
    name: data.name.trim(),
    slug,
    email: tokenData.email,
    passwordHash: hashPassword(data.password),
    staffPinHash: hashPin(data.staffPin.trim()),
    tier: tokenData.tier,
    timezone: data.timezone || 'Asia/Kolkata',
    googleReviewUrl: data.googleReviewUrl?.trim() || 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
    googlePlaceId: data.googlePlaceId?.trim() || 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    loyaltyTarget,
    loyaltyReward,
    spinWheelConfiguration: spinSlices,
    active: true,
    category: data.category.trim(),
    logoEmoji: data.logoEmoji || '🏢',
    logoUrl: data.logoUrl || undefined,
    address: data.address?.trim() || '123 Main Street',
    accentColor: data.accentColor || '#0e7c66',
    createdAt: new Date().toISOString(),
  };

  db.businesses.set(businessId, newBusiness);

  // Mark token completed
  tokenData.status = 'completed';
  tokenData.completedAt = new Date().toISOString();
  tokenData.businessId = businessId;

  // Initialize and automatically activate initial campaign offer
  const draftResult = createDraftOffer(businessId, {
    title: `${newBusiness.name} Launch Campaign`,
    description: 'Initial customer engagement campaign configured during onboarding.',
    durationDays: data.offerDurationDays || 30,
    spinWheelConfiguration: spinSlices,
    loyaltyTarget,
    loyaltyReward,
  });

  if (draftResult.success && draftResult.offer) {
    activateOffer(businessId, draftResult.offer.id, true);
  }

  // Create immediate staff session
  const sessionToken = `stf_${generateSecureKey(16)}`;
  const now = new Date();
  db.staffSessions.set(sessionToken, {
    token: sessionToken,
    businessId,
    tier: newBusiness.tier,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  });

  db.saveToDisk();

  const { passwordHash, staffPinHash, ...safeBusiness } = newBusiness;
  return {
    success: true,
    statusCode: 201,
    business: safeBusiness,
    sessionToken,
  };
}
