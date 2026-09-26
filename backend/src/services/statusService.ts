import { IBusiness, ICustomer } from '../config/db.js';
import { isCompletedToday } from '../utils/timezone.js';

export interface ICustomerStatus {
  customerId: string;
  businessId: string;
  mobile: string;
  name: string;
  spinAvailable: boolean;
  loyaltyAvailable: boolean;
  reviewAvailable: boolean;
  todaySpun: boolean;
  todayVisited: boolean;
  activeVoucher: ICustomer['activeVoucher'];
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

export function computeCustomerStatus(
  business: IBusiness,
  customer: ICustomer
): ICustomerStatus {
  const tz = business.timezone || 'UTC';

  const todaySpun = isCompletedToday(customer.lastSpinAt, tz);
  const todayVisited = isCompletedToday(customer.lastVisitAt, tz);

  // Spin availability:
  // Allowed if business tier is 'spin' or 'combined',
  // and customer has NOT spun today in merchant's timezone
  const tierSupportsSpin = business.tier === 'spin' || business.tier === 'combined' || business.tier === 'spin-review';
  const spinAvailable = tierSupportsSpin && !todaySpun;

  // Loyalty availability:
  // Allowed if business tier is 'loyalty' or 'combined',
  // and customer has NOT stamped a visit today in merchant's timezone
  const tierSupportsLoyalty = business.tier === 'loyalty' || business.tier === 'combined' || business.tier === 'loyalty-review';
  const loyaltyAvailable = tierSupportsLoyalty && !todayVisited;

  // Review availability:
  // Allowed if business tier is 'review' or 'combined',
  // and review journey not yet completed
  const tierSupportsReview = business.tier === 'review' || business.tier === 'combined' || business.tier === 'spin-review' || business.tier === 'loyalty-review';
  const reviewAvailable = tierSupportsReview && !customer.reviewJourneyCompleted;

  // Authoritative recommendation for first incomplete stage:
  let recommendedStage: ICustomerStatus['recommendedStage'] = 'cooldown';

  if (customer.activeVoucher) {
    // If there's an active voucher needing redemption/view
    recommendedStage = 'voucher';
  } else if (spinAvailable) {
    recommendedStage = 'spin';
  } else if (loyaltyAvailable) {
    recommendedStage = 'loyalty';
  } else if (reviewAvailable) {
    recommendedStage = 'review';
  } else {
    // Both daily actions completed and review completed (or tier exhausted)
    recommendedStage = (todaySpun || todayVisited) ? 'cooldown' : 'thank_you';
  }

  return {
    customerId: customer.id,
    businessId: business.id,
    mobile: customer.mobile,
    name: customer.name,
    spinAvailable,
    loyaltyAvailable,
    reviewAvailable,
    todaySpun,
    todayVisited,
    activeVoucher: customer.activeVoucher,
    visitCount: customer.visitCount,
    totalVisits: customer.totalVisits,
    loyaltyTarget: business.loyaltyTarget,
    loyaltyReward: business.loyaltyReward,
    lastSpinAt: customer.lastSpinAt,
    lastVisitAt: customer.lastVisitAt,
    totalRewardsClaimed: customer.totalRewardsClaimed,
    reviewJourneyCompleted: customer.reviewJourneyCompleted,
    recommendedStage,
    timezone: tz,
  };
}
