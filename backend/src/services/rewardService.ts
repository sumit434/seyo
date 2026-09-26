import { db, IReward } from '../config/db.js';
import { generateSecureKey, generateVoucherCode } from '../utils/crypto.js';
import { verifyPin } from '../utils/pin.js';
import { getBusinessById } from './businessService.js';
import { getCustomerById } from './customerService.js';

export function issueReward(
  businessId: string,
  customerId: string,
  title: string,
  type: 'spin' | 'loyalty'
): IReward {
  const code = generateVoucherCode(type === 'spin' ? 'SPN' : 'LOY');
  const reward: IReward = {
    id: `rew_${generateSecureKey(8)}`,
    businessId,
    customerId,
    code,
    title,
    type,
    status: 'active',
    claimedAt: new Date().toISOString(),
    redeemedAt: null,
    staffPinVerifiedBy: null,
  };

  db.rewards.set(reward.id, reward);

  // Link active voucher to customer
  const customer = getCustomerById(businessId, customerId);
  if (customer) {
    customer.activeVoucher = {
      rewardId: reward.id,
      code: reward.code,
      title: reward.title,
      type: reward.type,
      claimedAt: reward.claimedAt,
    };
  }

  db.saveToDisk();
  return reward;
}

export interface RedeemRewardResult {
  success: boolean;
  statusCode: number;
  message: string;
  reward?: IReward;
}

export function redeemRewardWithPin(
  businessId: string,
  customerId: string,
  voucherCode: string,
  pin: string
): RedeemRewardResult {
  const business = getBusinessById(businessId);
  if (!business) {
    return { success: false, statusCode: 404, message: 'Business not found.' };
  }

  // Verify Staff PIN
  const isPinValid = verifyPin(pin, business.staffPinHash);
  if (!isPinValid) {
    return {
      success: false,
      statusCode: 401,
      message: 'Invalid Staff PIN. Please ask an authorized staff member to enter their PIN.',
    };
  }

  // Find the reward
  let targetReward: IReward | null = null;
  for (const rew of db.rewards.values()) {
    if (
      rew.businessId === businessId &&
      rew.customerId === customerId &&
      rew.code.toUpperCase() === voucherCode.toUpperCase()
    ) {
      targetReward = rew;
      break;
    }
  }

  if (!targetReward) {
    return {
      success: false,
      statusCode: 404,
      message: 'Voucher code not found for this customer.',
    };
  }

  // Check if already redeemed
  if (targetReward.status === 'redeemed') {
    return {
      success: false,
      statusCode: 409,
      message: 'This voucher has already been redeemed.',
    };
  }

  // Atomic state transition
  targetReward.status = 'redeemed';
  targetReward.redeemedAt = new Date().toISOString();
  targetReward.staffPinVerifiedBy = `staff_verified_${business.name}`;

  // Update customer
  const customer = getCustomerById(businessId, customerId);
  if (customer) {
    customer.activeVoucher = null;
    customer.totalRewardsClaimed = (customer.totalRewardsClaimed || 0) + 1;

    // If this was a loyalty milestone reward, reset cycle visits to 0
    if (targetReward.type === 'loyalty') {
      customer.visitCount = 0;
    }
  }

  db.saveToDisk();

  return {
    success: true,
    statusCode: 200,
    message: 'Reward successfully verified and redeemed!',
    reward: targetReward,
  };
}
