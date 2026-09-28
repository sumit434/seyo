import { db } from '../config/db.js';
import { isCompletedToday } from '../utils/timezone.js';
import { getBusinessById } from './businessService.js';
import { getCustomerById } from './customerService.js';
import { issueReward } from './rewardService.js';
import { recordOfferMetric } from './offerService.js';

export function pickWinningSlice(slices: Array<{ id: string; rewardLabel: string; weight: number }>) {
  if (!slices || slices.length === 0) {
    throw new Error('No active slices configured for spin wheel');
  }

  const totalWeight = slices.reduce((acc, s) => acc + (s.weight || 1), 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    const weight = slice.weight || 1;
    if (random <= weight) {
      return { slice, index: i };
    }
    random -= weight;
  }

  return { slice: slices[0], index: 0 };
}

export function executeSpin(businessId: string, customerId: string) {
  const business = getBusinessById(businessId);
  if (!business) {
    return { success: false, statusCode: 404, message: 'Business not found' };
  }

  if (business.tier !== 'spin' && business.tier !== 'combined') {
    return {
      success: false,
      statusCode: 403,
      message: 'Spin & Win module is not enabled for this establishment.',
    };
  }

  const customer = getCustomerById(businessId, customerId);
  if (!customer) {
    return { success: false, statusCode: 404, message: 'Customer not found' };
  }

  // Check if customer already spun today in merchant timezone
  if (isCompletedToday(customer.lastSpinAt, business.timezone)) {
    return {
      success: false,
      statusCode: 409,
      message: 'MIDNIGHT_COOLDOWN: You have already used your daily spin today.',
      cooldown: true,
    };
  }

  // Pick winning slice with guaranteed reward
  const { slice, index } = pickWinningSlice(business.spinWheelConfiguration);

  const now = new Date().toISOString();
  customer.lastSpinAt = now;
  customer.totalSpins = (customer.totalSpins || 0) + 1;

  // Issue real-world Reward record
  const reward = issueReward(businessId, customerId, slice.rewardLabel, 'spin');
  recordOfferMetric(businessId, 'rewardsIssued');

  db.saveToDisk();

  return {
    success: true,
    statusCode: 200,
    winningSlice: slice,
    sliceIndex: index,
    reward,
  };
}
