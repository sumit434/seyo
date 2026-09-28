import { db } from '../config/db.js';
import { isCompletedToday } from '../utils/timezone.js';
import { getBusinessById } from './businessService.js';
import { getCustomerById } from './customerService.js';
import { issueReward } from './rewardService.js';
import { recordOfferMetric } from './offerService.js';

export function stampLoyaltyVisit(businessId: string, customerId: string) {
  const business = getBusinessById(businessId);
  if (!business) {
    return { success: false, statusCode: 404, message: 'Business not found' };
  }

  if (business.tier !== 'loyalty' && business.tier !== 'combined') {
    return {
      success: false,
      statusCode: 403,
      message: 'Loyalty module is not enabled for this establishment.',
    };
  }

  const customer = getCustomerById(businessId, customerId);
  if (!customer) {
    return { success: false, statusCode: 404, message: 'Customer not found' };
  }

  // Authoritative daily check in merchant's timezone
  if (isCompletedToday(customer.lastVisitAt, business.timezone)) {
    return {
      success: false,
      statusCode: 409,
      message: 'MIDNIGHT_COOLDOWN: Your visit has already been stamped for today.',
      cooldown: true,
    };
  }

  const now = new Date().toISOString();
  customer.lastVisitAt = now;
  customer.visitCount = (customer.visitCount || 0) + 1;
  customer.totalVisits = (customer.totalVisits || 0) + 1;

  let milestoneReached = false;
  let reward = null;

  // Milestone check
  if (customer.visitCount >= business.loyaltyTarget) {
    milestoneReached = true;
    reward = issueReward(
      businessId,
      customerId,
      business.loyaltyReward || 'Loyalty Milestone Reward',
      'loyalty'
    );
    recordOfferMetric(businessId, 'rewardsIssued');
  }

  db.saveToDisk();

  return {
    success: true,
    statusCode: 200,
    visitCount: customer.visitCount,
    totalVisits: customer.totalVisits,
    loyaltyTarget: business.loyaltyTarget,
    milestoneReached,
    reward,
  };
}
