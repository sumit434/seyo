export const TIERS = {
  SPIN: 'spin',
  LOYALTY: 'loyalty',
  REVIEW: 'review',
  COMBINED: 'combined',
} as const;

export type TierType = (typeof TIERS)[keyof typeof TIERS];

export const FLOW_STAGES = {
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

export type FlowStageType = (typeof FLOW_STAGES)[keyof typeof FLOW_STAGES];

export const STORAGE_KEYS = {
  SESSION: 'seyo_customer_session',
  STAFF_TOKEN: 'seyo_staff_token',
  STAFF_BUSINESS: 'seyo_staff_business',
} as const;
