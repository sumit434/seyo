import { MemoryDB } from '../db/MemoryDB';
import { Customer } from '../../../shared/types/customer';
import { Reward } from '../../../shared/types/reward';
import { generateSecureToken, generateVoucherCode, maskMobile } from '../utils/crypto';
import { isSameMerchantDay, isWithinValidationWindow } from '../utils/timezone';

export class LoyaltyService {
  private db: MemoryDB;

  constructor() {
    this.db = MemoryDB.getInstance();
  }

  /**
   * Stamp customer loyalty visit
   */
  public stampVisit(businessId: string, customerId: string): {
    customer: Customer;
    milestoneReached: boolean;
    reward?: Reward;
  } {
    const business = this.db.getBusinessById(businessId);
    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    if (business.tier !== 'loyalty' && business.tier !== 'combined') {
      throw new Error('INVALID_TIER: This business tier does not support loyalty stamps');
    }

    const offer = this.db.getActiveOfferByBusinessId(businessId);
    if (!offer || offer.status !== 'active') {
      throw new Error('OFFER_NOT_ACTIVE: No active loyalty campaign');
    }

    const customer = this.db.getCustomerById(customerId);
    if (!customer || customer.businessId !== businessId) {
      throw new Error('CUSTOMER_NOT_FOUND: Customer not found or cross-business violation');
    }

    const now = new Date();
    const tz = business.timezone || 'UTC';

    // Daily restriction: only 1 stamp per calendar day in merchant timezone
    if (customer.lastVisitAt && isSameMerchantDay(customer.lastVisitAt, now, tz)) {
      throw new Error('VISIT_ALREADY_COMPLETED: You have already stamped your visit today. Resets at midnight.');
    }

    const validationDays = offer.loyaltyValidationDays || business.loyaltyValidationDays || 60;
    const target = offer.loyaltyTarget || business.loyaltyTarget || 6;
    const rewardTitle = offer.loyaltyReward || business.loyaltyReward || 'Special Loyalty Reward';

    // Check validation window if cycle was started
    if (customer.visitCount > 0 && customer.lastVisitAt) {
      const isWindowValid = isWithinValidationWindow(customer.createdAt, now, validationDays, tz);
      if (!isWindowValid) {
        // Window expired, cycle resets
        customer.visitCount = 0;
      }
    }

    // Increment visitCount and lifetime totalVisits
    customer.visitCount = (customer.visitCount || 0) + 1;
    customer.totalVisits = (customer.totalVisits || 0) + 1;
    const nowIso = now.toISOString();
    customer.lastVisitAt = nowIso;
    customer.updatedAt = nowIso;

    // Update offer metrics
    offer.metrics.loyaltyStampsIssued += 1;

    let milestoneReached = false;
    let reward: Reward | undefined;

    // Check if target is reached
    if (customer.visitCount >= target) {
      milestoneReached = true;
      const rewardId = `rew_loyalty_${generateSecureToken(8)}`;
      const voucherCode = generateVoucherCode('LOYAL');

      reward = {
        id: rewardId,
        businessId,
        customerId,
        customerName: customer.name,
        customerMobileMasked: maskMobile(customer.mobile),
        code: voucherCode,
        title: rewardTitle,
        type: 'loyalty',
        status: 'issued',
        claimedAt: nowIso,
      };

      this.db.saveReward(reward);

      // Reset cycle visitCount to 0 for next reward cycle, but KEEP lifetime totalVisits
      customer.visitCount = 0;
      customer.totalRewardsClaimed = (customer.totalRewardsClaimed || 0) + 1;
      customer.activeVoucher = {
        rewardId,
        code: voucherCode,
        title: rewardTitle,
        type: 'loyalty',
        claimedAt: nowIso,
      };

      offer.metrics.loyaltyMilestonesClaimed += 1;
    }

    this.db.saveCustomer(customer);
    this.db.saveOffer(offer);

    return {
      customer,
      milestoneReached,
      reward,
    };
  }
}
