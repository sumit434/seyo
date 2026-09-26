import { CustomerStatus } from '../services/apiServices.js';
import { FlowStage } from './flowStages.js';

export interface FlowDecisionOptions {
 routeModule?: 'spin' | 'loyalty' | 'review' | 'combined' | 'v' | 'spin-review' | 'loyalty-review';
}

export function determineNextStage(
  status: CustomerStatus | null,
  options: FlowDecisionOptions = {}
): FlowStage {
  if (!status) {
    return 'identify';
  }

  // 1. If an active voucher exists, customer must view / redeem it first
  if (status.activeVoucher) {
    return 'voucher';
  }

  const route = options.routeModule || 'combined';

  // 2. Dedicated Single Module Routes
  if (route === 'spin') {
    if (status.spinAvailable) return 'spin';
    return 'cooldown';
  }

  if (route === 'loyalty') {
    if (status.loyaltyAvailable) return 'loyalty';
    return 'cooldown';
  }

  if (route === 'review') {
    if (status.reviewAvailable) return 'review';
    return 'thank_you';
  }

  // 3. Custom Dual-App Combo: Spin + Review
  if (route === 'spin-review') {
    if (status.spinAvailable) {
      return 'spin';
    }
    if (status.reviewAvailable) {
      return 'review';
    }
    if (status.todaySpun) {
      return 'cooldown';
    }
    return 'thank_you';
  }

  // 4. Custom Dual-App Combo: Loyalty + Review
  if (route === 'loyalty-review') {
    if (status.loyaltyAvailable) {
      return 'loyalty';
    }
    if (status.reviewAvailable) {
      return 'review';
    }
    if (status.todayVisited) {
      return 'cooldown';
    }
    return 'thank_you';
  }

  // 5. Default Combined Decision Engine (Spin -> Loyalty -> Review)
  if (status.spinAvailable) {
    return 'spin';
  }

  if (status.loyaltyAvailable) {
    return 'loyalty';
  }

  if (status.reviewAvailable) {
    return 'review';
  }

  if (status.todaySpun || status.todayVisited) {
    return 'cooldown';
  }

  return 'thank_you';
}