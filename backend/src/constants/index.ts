export const TIERS = {
  SPIN: 'spin',
  LOYALTY: 'loyalty',
  REVIEW: 'review',
  COMBINED: 'combined',
} as const;

export type TierType = typeof TIERS[keyof typeof TIERS];

export const STAGES = {
  IDENTIFY: 'identify',
  STATUS: 'status',
  SPIN: 'spin',
  VOUCHER: 'voucher',
  LOYALTY: 'loyalty',
  LOYALTY_REWARD: 'loyalty_reward',
  REVIEW: 'review',
  COOLDOWN: 'cooldown',
  THANK_YOU: 'thank_you',
} as const;

export type StageType = typeof STAGES[keyof typeof STAGES];

export const REWARD_STATUS = {
  ACTIVE: 'active',
  REDEEMED: 'redeemed',
  EXPIRED: 'expired',
} as const;

export type RewardStatusType = typeof REWARD_STATUS[keyof typeof REWARD_STATUS];

export const REVIEW_STATUS = {
  GENERATED: 'generated',
  PERSISTED: 'persisted',
  GOOGLE_OPENED: 'google_opened',
} as const;

export type ReviewStatusType = typeof REVIEW_STATUS[keyof typeof REVIEW_STATUS];

export const QR_TYPES = {
  SPIN: 'spin',
  LOYALTY: 'loyalty',
  COMBINED: 'combined',
} as const;

export type QRType = typeof QR_TYPES[keyof typeof QR_TYPES];
