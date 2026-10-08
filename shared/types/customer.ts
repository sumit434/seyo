export interface Customer {
  id: string;
  businessId: string;
  mobile: string;
  name: string;
  visitCount: number; // Current cycle visits toward loyaltyTarget
  totalVisits: number; // Lifetime total visits (never reset, used for Top 5 Loyal Legends)
  lastVisitAt?: string; // ISO UTC
  totalRewardsClaimed: number;
  lastSpinAt?: string; // ISO UTC
  totalSpins: number;
  activeVoucher?: {
    rewardId: string;
    code: string;
    title: string;
    type: 'spin' | 'loyalty';
    claimedAt: string;
  };
  reviewJourneyCompleted: boolean;
  reviewJourneyCompletedAt?: string;
  hasEnteredReviewFlow?: boolean;
  reviewAcceleratorEntryId?: string;
  voucherDeferred?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPublicProfile {
  id: string;
  name: string;
  mobileMasked: string;
  visitCount: number;
  totalVisits: number;
}

export interface TopRanker {
  rank: number;
  name: string;
  maskedMobile: string;
  totalVisits: number;
  visitCount: number;
}
