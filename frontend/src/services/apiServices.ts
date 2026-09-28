import { request } from './api.js';

export interface SpinWheelSlice {
  id: string;
  rewardLabel: string;
  emoji: string;
  weight: number;
}

export interface BusinessConfig {
  id: string;
  name: string;
  slug: string;
  tier: 'combined' | 'spin' | 'loyalty' | 'review';
  category: string;
  logoEmoji: string;
  logoUrl?: string;
  address: string;
  accentColor: string;
  timezone: string;
  loyaltyTarget: number;
  loyaltyReward: string;
  googleReviewUrl: string;
  spinWheelConfiguration: Array<{
    id: string;
    rewardLabel: string;
    emoji: string;
    weight: number;
  }>;
}

export type OfferStatus = 'no_offer' | 'draft' | 'active' | 'completed' | 'cancelled';

export interface OfferData {
  id: string;
  businessId: string;
  title: string;
  description?: string;
  tier: 'combined' | 'spin' | 'loyalty' | 'review';
  status: OfferStatus;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  cancelledAt: string | null;
  durationDays: number;
  spinWheelConfiguration?: Array<{
    id: string;
    rewardLabel: string;
    emoji: string;
    weight: number;
  }>;
  loyaltyTarget?: number;
  loyaltyReward?: string;
  metrics: {
    scans: number;
    identifiedGuests: number;
    rewardsIssued: number;
    rewardsRedeemed: number;
    reviewsPrompted: number;
    reviewsPersisted: number;
  };
}

export interface CustomerStatus {
  customerId: string;
  businessId: string;
  mobile: string;
  name: string;
  spinAvailable: boolean;
  loyaltyAvailable: boolean;
  reviewAvailable: boolean;
  todaySpun: boolean;
  todayVisited: boolean;
  activeVoucher: {
    rewardId: string;
    code: string;
    title: string;
    type: 'spin' | 'loyalty';
    claimedAt: string;
  } | null;
  visitCount: number;
  totalVisits: number;
  loyaltyTarget: number;
  loyaltyReward: string;
  lastSpinAt: string | null;
  lastVisitAt: string | null;
  totalRewardsClaimed: number;
  reviewJourneyCompleted: boolean;
  recommendedStage: 'voucher' | 'spin' | 'loyalty' | 'review' | 'cooldown' | 'thank_you';
  timezone: string;
}

export const customerApi = {
  getBusiness(slug: string) {
    return request<{ success: boolean; business: BusinessConfig }>(`/business/${slug}`);
  },

  getAllBusinesses() {
    return request<{ success: boolean; businesses: BusinessConfig[] }>('/business');
  },

  identify(slug: string, mobile: string, name?: string, qrKey?: string) {
    return request<{
      success: boolean;
      customer: any;
      status: CustomerStatus;
      business: BusinessConfig;
      qrLocked: boolean;
    }>('/customer/identify', {
      method: 'POST',
      body: JSON.stringify({ slug, mobile, name, qrKey }),
    });
  },

  getStatus(slug: string, customerId: string) {
    return request<{
      success: boolean;
      status: CustomerStatus;
      customer: any;
      business: BusinessConfig;
    }>(`/customer/status/${slug}/${customerId}`);
  },
};

export const qrApi = {
  getInfo(key: string) {
    return request<{
      success: boolean;
      qr: {
        key: string;
        type: 'spin' | 'loyalty' | 'combined';
        isUsed: boolean;
        expiresAt: string;
        businessSlug: string;
        businessName: string;
      };
    }>(`/qr/info/${key}`);
  },
};

export const spinApi = {
  execute(businessId: string, customerId: string) {
    return request<{
      success: boolean;
      winningSlice: { id: string; rewardLabel: string; emoji: string };
      sliceIndex: number;
      reward: any;
      status: CustomerStatus;
    }>('/spin', {
      method: 'POST',
      body: JSON.stringify({ businessId, customerId }),
    });
  },
};

export const loyaltyApi = {
  stamp(businessId: string, customerId: string) {
    return request<{
      success: boolean;
      visitCount: number;
      totalVisits: number;
      milestoneReached: boolean;
      reward: any;
      status: CustomerStatus;
    }>('/loyalty/stamp', {
      method: 'POST',
      body: JSON.stringify({ businessId, customerId }),
    });
  },
};

export const rewardApi = {
  redeem(businessId: string, customerId: string, voucherCode: string, pin: string) {
    return request<{
      success: boolean;
      message: string;
      reward: any;
      status: CustomerStatus;
    }>('/reward/redeem', {
      method: 'POST',
      body: JSON.stringify({ businessId, customerId, voucherCode, pin }),
    });
  },
};

export const reviewApi = {
  generateSuggestions(businessId: string, rating: number, tags: string[], note?: string) {
    return request<{ success: boolean; suggestions: string[] }>('/review/generate', {
      method: 'POST',
      body: JSON.stringify({ businessId, rating, tags, note }),
    });
  },

  persist(businessId: string, customerId: string, reviewText: string, rating: number, tags: string[]) {
    return request<{
      success: boolean;
      message: string;
      reviewLog: any;
      googleReviewUrl: string;
      status: CustomerStatus;
    }>('/review/persist', {
      method: 'POST',
      body: JSON.stringify({ businessId, customerId, reviewText, rating, tags }),
    });
  },

  logGoogleOpened(reviewId: string) {
    return request<{ success: boolean }>('/review/opened', {
      method: 'POST',
      body: JSON.stringify({ reviewId }),
    });
  },
};

export const staffApi = {
  login(email: string, password: string) {
    return request<{
      success: boolean;
      token: string;
      business: any;
    }>('/staff/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getTerminalData(token: string) {
    return request<{
      success: boolean;
      business: BusinessConfig;
      activeOffer: OfferData | null;
      offers: OfferData[];
      stats: {
        totalCustomers: number;
        totalRewardsRedeemed: number;
        activeVouchersWaiting: number;
        totalReviewsPersisted: number;
        activeOfferScans?: number;
        activeOfferIdentified?: number;
        activeOfferRewardsIssued?: number;
        activeOfferRewardsRedeemed?: number;
        activeOfferReviewsPersisted?: number;
      };
      recentRewards: any[];
      recentReviews: any[];
    }>('/staff/terminal-data', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  generateQR(token: string, type: 'spin' | 'loyalty' | 'combined', ttlMinutes = 15) {
    return request<{
      success: boolean;
      qr: any;
      targetUrl: string;
    }>('/staff/generate-qr', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type, ttlMinutes }),
    });
  },
};

export const onboardingApi = {
  generateToken(email: string, tier: 'combined' | 'spin' | 'loyalty' | 'review', businessName?: string) {
    return request<{
      success: boolean;
      token: string;
      onboardingUrl: string;
      expiresAt: string;
      tier: string;
      message: string;
    }>('/onboarding/generate-token', {
      method: 'POST',
      body: JSON.stringify({ email, tier, businessName }),
    });
  },

  validateToken(token: string) {
    return request<{
      success: boolean;
      tokenData: {
        email: string;
        tier: 'combined' | 'spin' | 'loyalty' | 'review';
        businessName?: string;
        expiresAt: string;
      };
    }>(`/onboarding/validate/${token}`);
  },

  complete(token: string, businessData: any) {
    return request<{
      success: boolean;
      message: string;
      business: BusinessConfig;
      sessionToken: string;
    }>('/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ token, ...businessData }),
    });
  },
};

export const offerApi = {
  getCurrent(businessId: string) {
    return request<{
      success: boolean;
      activeOffer: OfferData | null;
      offers: OfferData[];
    }>(`/offers/current/${businessId}`);
  },

  createDraft(token: string, draftData: Partial<OfferData>) {
    return request<{
      success: boolean;
      offer: OfferData;
      message: string;
    }>('/offers/draft', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(draftData),
    });
  },

  updateDraft(token: string, offerId: string, draftData: Partial<OfferData>) {
    return request<{
      success: boolean;
      offer: OfferData;
      message: string;
    }>(`/offers/${offerId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(draftData),
    });
  },

  activate(token: string, offerId: string, confirmImmutability: boolean) {
    return request<{
      success: boolean;
      offer: OfferData;
      message: string;
    }>('/offers/activate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ offerId, confirmImmutability }),
    });
  },

  cancel(token: string, offerId: string) {
    return request<{
      success: boolean;
      offer: OfferData;
      message: string;
    }>('/offers/cancel', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ offerId }),
    });
  },
};

export const brandingApi = {
  updateBranding(token: string, businessId: string, branding: { logoUrl?: string; logoEmoji?: string; accentColor?: string; address?: string }) {
    return request<{
      success: boolean;
      business: BusinessConfig;
      message: string;
    }>(`/business/${businessId}/branding`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(branding),
    });
  },
};

