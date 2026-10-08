import { ProductTier } from '../constants/tiers';

export interface SpinSliceConfig {
  id: string;
  rewardLabel: string;
  emoji: string;
  weight: number; // percentage 1-100, sum must be exactly 100
}

export type OnboardingStepName = 'profile' | 'logo' | 'configuration' | 'security' | 'confirmation' | 'completed';

export interface Business {
  id: string;
  name: string;
  slug: string;
  email: string;
  passwordHash: string; // Staff login password hash
  staffPinHash: string; // 4-digit staff voucher verification PIN hash
  tier: ProductTier;
  timezone: string; // IANA timezone e.g. 'America/New_York'
  country: string; // One of 10 allowed countries
  city: string;
  category: string;
  googleReviewUrl?: string;
  googlePlaceId?: string;
  zomatoUrl?: string;
  swiggyUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  facebookUrl?: string;
  loyaltyTarget?: number; // 3-365
  loyaltyValidationDays?: number; // 3-365 (independent from loyaltyTarget)
  loyaltyReward?: string;
  spinWheelConfiguration?: SpinSliceConfig[];
  active: boolean;
  logoEmoji: string;
  logoUrl?: string;
  accentColor: string;
  onboardingStep: OnboardingStepName;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string;
}

export interface BusinessPublicInfo {
  id: string;
  name: string;
  slug: string;
  tier: ProductTier;
  category: string;
  city: string;
  country: string;
  timezone: string;
  logoEmoji: string;
  logoUrl?: string;
  accentColor: string;
  zomatoUrl?: string;
  swiggyUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  facebookUrl?: string;
  googleReviewUrl?: string;
}
