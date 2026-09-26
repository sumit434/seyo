export type FlowStage =
  | 'identify'
  | 'status'
  | 'spin'
  | 'voucher'
  | 'loyalty'
  | 'loyalty_reward'
  | 'review'
  | 'cooldown'
  | 'thank_you';

export interface StageDefinition {
  id: FlowStage;
  label: string;
  description: string;
}

export const STAGE_DEFINITIONS: Record<FlowStage, StageDefinition> = {
  identify: {
    id: 'identify',
    label: 'Check In',
    description: 'Enter your mobile number to unlock rewards',
  },
  status: {
    id: 'status',
    label: 'Verifying',
    description: 'Checking your current visit and reward status',
  },
  spin: {
    id: 'spin',
    label: 'Spin & Win',
    description: 'Spin the wheel for your guaranteed dining reward',
  },
  voucher: {
    id: 'voucher',
    label: 'Reward Voucher',
    description: 'Present this reward to your server to redeem',
  },
  loyalty: {
    id: 'loyalty',
    label: 'Digital Loyalty',
    description: 'Stamp your visit today and unlock milestone perks',
  },
  loyalty_reward: {
    id: 'loyalty_reward',
    label: 'Milestone Unlocked',
    description: 'You unlocked your milestone loyalty reward!',
  },
  review: {
    id: 'review',
    label: 'Review Booster',
    description: 'Share your genuine experience on Google Reviews',
  },
  cooldown: {
    id: 'cooldown',
    label: 'Daily Reset',
    description: 'Your daily offer will refresh at midnight',
  },
  thank_you: {
    id: 'thank_you',
    label: 'Thank You',
    description: 'All engagement stages completed for today',
  },
};
