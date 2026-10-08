import { hashPassword, hashPin } from '../utils/crypto';
import { Business } from '../../../shared/types/business';
import { Offer } from '../../../shared/types/offer';
import { MerchantEntry } from '../../../shared/types/qr';
import { Customer } from '../../../shared/types/customer';
import { Reward } from '../../../shared/types/reward';
import { ReviewLog } from '../../../shared/types/review';

export function createInitialSeedData() {
  const defaultPasswordHash = hashPassword('seyo1234');
  const defaultPinHash = hashPin('7788');

  // Business 1: Combined Tier - "Bella Napoli Pizzeria"
  const business1: Business = {
    id: 'biz_bella_napoli',
    name: 'Bella Napoli Pizzeria',
    slug: 'bella-napoli',
    email: 'owner@bellanapoli.com',
    passwordHash: defaultPasswordHash,
    staffPinHash: defaultPinHash,
    tier: 'combined',
    timezone: 'America/New_York',
    country: 'United States',
    city: 'New York',
    category: 'Restaurant & Bar',
    googleReviewUrl: 'https://maps.google.com/?q=Bella+Napoli+Pizza+NY',
    googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    zomatoUrl: 'https://www.zomato.com/new-york-city/bella-napoli',
    swiggyUrl: 'https://www.swiggy.com/restaurants/bella-napoli-pizzeria',
    instagramUrl: 'https://www.instagram.com/bellanapolipizza',
    loyaltyTarget: 6,
    loyaltyValidationDays: 45,
    loyaltyReward: 'Free Wood-Fired Margherita Pizza',
    spinWheelConfiguration: [
      { id: 's1', rewardLabel: '15% Off Your Entire Bill', emoji: '🍕', weight: 25 },
      { id: 's2', rewardLabel: 'Free Artisanal Gelato Cup', emoji: '🍨', weight: 20 },
      { id: 's3', rewardLabel: 'Free Garlic Knots Basket', emoji: '🥖', weight: 20 },
      { id: 's4', rewardLabel: 'Complimentary Soft Beverage', emoji: '🥤', weight: 15 },
      { id: 's5', rewardLabel: 'Free Italian Tiramisu Slice', emoji: '🍰', weight: 10 },
      { id: 's6', rewardLabel: 'Chef Special VIP Tasting Plate', emoji: '⭐', weight: 10 },
    ],
    active: true,
    logoEmoji: '🍕',
    accentColor: '#0e7c66',
    onboardingStep: 'completed',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const offer1: Offer = {
    id: 'off_bella_combined',
    businessId: 'biz_bella_napoli',
    title: 'Spring Loyalty & Dining Fiesta',
    description: 'Spin for instant treats, earn stamps toward your free Margherita pizza, and share your experience!',
    tier: 'combined',
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    activatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    durationDays: 90,
    spinWheelConfiguration: business1.spinWheelConfiguration,
    loyaltyTarget: 6,
    loyaltyValidationDays: 45,
    loyaltyReward: 'Free Wood-Fired Margherita Pizza',
    googleReviewUrl: business1.googleReviewUrl,
    metrics: {
      scans: 142,
      identifiedGuests: 89,
      rewardsIssued: 54,
      rewardsRedeemed: 38,
      reviewsPrompted: 45,
      reviewsPersisted: 42,
      loyaltyStampsIssued: 98,
      loyaltyMilestonesClaimed: 11,
    },
  };

  const entry1_qr: MerchantEntry = {
    id: 'entry_bella_qr',
    businessId: 'biz_bella_napoli',
    businessSlug: 'bella-napoli',
    entryType: 'merchant_qr',
    label: 'Dynamic QR',
    permanentCode: 'BN-QR-COUNTER',
    targetTier: 'combined',
    createdAt: new Date().toISOString(),
  };

  const entry1_nfc: MerchantEntry = {
    id: 'entry_bella_nfc',
    businessId: 'biz_bella_napoli',
    businessSlug: 'bella-napoli',
    entryType: 'combined',
    label: 'Physical NFC Tag',
    permanentCode: 'BN-NFC-T10',
    targetTier: 'combined',
    createdAt: new Date().toISOString(),
  };

  const entry1_loyalty: MerchantEntry = {
    id: 'entry_bella_instant_loyalty',
    businessId: 'biz_bella_napoli',
    businessSlug: 'bella-napoli',
    entryType: 'loyalty',
    label: 'Express Loyalty NFC Tag',
    permanentCode: 'BN-LOYALTY-EXPRESS',
    targetTier: 'combined',
    createdAt: new Date().toISOString(),
  };

  // Business 2: Spin Tier - "Tokyo Ramen Lab"
  const business2: Business = {
    id: 'biz_tokyo_ramen',
    name: 'Tokyo Ramen Lab',
    slug: 'tokyo-ramen',
    email: 'lab@tokyoramen.jp',
    passwordHash: defaultPasswordHash,
    staffPinHash: defaultPinHash,
    tier: 'spin',
    timezone: 'Asia/Tokyo',
    country: 'Japan',
    city: 'Tokyo',
    category: 'Ramen & Noodles',
    googleReviewUrl: 'https://maps.google.com/?q=Tokyo+Ramen+Lab',
    spinWheelConfiguration: [
      { id: 'tr1', rewardLabel: 'Extra Chashu Slice Topping', emoji: '🍜', weight: 30 },
      { id: 'tr2', rewardLabel: 'Complimentary Ajitsuke Tamago (Egg)', emoji: '⭐', weight: 25 },
      { id: 'tr3', rewardLabel: 'Free Side of Gyoza (4 pcs)', emoji: '🥟', weight: 20 },
      { id: 'tr4', rewardLabel: 'Free Iced Oolong Tea', emoji: '🍵', weight: 15 },
      { id: 'tr5', rewardLabel: 'Full Bowl Ramen Upgrade', emoji: '🏆', weight: 10 },
    ],
    active: true,
    logoEmoji: '🍜',
    accentColor: '#d97706',
    onboardingStep: 'completed',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const offer2: Offer = {
    id: 'off_tokyo_spin',
    businessId: 'biz_tokyo_ramen',
    title: 'Tokyo Slurp & Spin Wheel',
    description: 'Every bowl earns a lucky spin! 100% all-win guaranteed upgrades.',
    tier: 'spin',
    status: 'active',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    activatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    durationDays: 60,
    spinWheelConfiguration: business2.spinWheelConfiguration,
    googleReviewUrl: business2.googleReviewUrl,
    metrics: {
      scans: 95,
      identifiedGuests: 73,
      rewardsIssued: 73,
      rewardsRedeemed: 61,
      reviewsPrompted: 0,
      reviewsPersisted: 0,
      loyaltyStampsIssued: 0,
      loyaltyMilestonesClaimed: 0,
    },
  };

  const entry2_qr: MerchantEntry = {
    id: 'entry_tokyo_qr',
    businessId: 'biz_tokyo_ramen',
    businessSlug: 'tokyo-ramen',
    entryType: 'merchant_qr',
    label: 'Counter QR Card',
    permanentCode: 'TR-QR-MAIN',
    targetTier: 'spin',
    createdAt: new Date().toISOString(),
  };

  // Seed some loyal customers for Bella Napoli to demonstrate Top Rankers and Staff terminal lists
  const customers: Customer[] = [
    {
      id: 'cust_marco',
      businessId: 'biz_bella_napoli',
      mobile: '+15552345678',
      name: 'Marco Rossi',
      visitCount: 5,
      totalVisits: 28,
      lastVisitAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      totalRewardsClaimed: 4,
      lastSpinAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      totalSpins: 14,
      reviewJourneyCompleted: true,
      reviewJourneyCompletedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cust_sarah',
      businessId: 'biz_bella_napoli',
      mobile: '+15553456789',
      name: 'Sarah Jenkins',
      visitCount: 4,
      totalVisits: 22,
      lastVisitAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      totalRewardsClaimed: 3,
      lastSpinAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      totalSpins: 12,
      reviewJourneyCompleted: true,
      createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cust_alex',
      businessId: 'biz_bella_napoli',
      mobile: '+15554567890',
      name: 'Alex Chen',
      visitCount: 3,
      totalVisits: 17,
      lastVisitAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      totalRewardsClaimed: 2,
      totalSpins: 9,
      reviewJourneyCompleted: false,
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cust_elena',
      businessId: 'biz_bella_napoli',
      mobile: '+15555678901',
      name: 'Elena Rostova',
      visitCount: 2,
      totalVisits: 12,
      lastVisitAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalRewardsClaimed: 1,
      totalSpins: 6,
      reviewJourneyCompleted: true,
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cust_david',
      businessId: 'biz_bella_napoli',
      mobile: '+15556789012',
      name: 'David Miller',
      visitCount: 1,
      totalVisits: 8,
      lastVisitAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      totalRewardsClaimed: 1,
      totalSpins: 4,
      reviewJourneyCompleted: false,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cust_kenji',
      businessId: 'biz_tokyo_ramen',
      mobile: '+819012345678',
      name: 'Kenji Sato',
      visitCount: 2,
      totalVisits: 5,
      lastVisitAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      totalRewardsClaimed: 1,
      totalSpins: 3,
      reviewJourneyCompleted: false,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Seed sample active voucher for Marco
  const sampleReward: Reward = {
    id: 'rew_sample_voucher_1',
    businessId: 'biz_bella_napoli',
    customerId: 'cust_marco',
    customerName: 'Marco Rossi',
    customerMobileMasked: '******5678',
    code: 'SY-MARCO9',
    title: '15% Off Your Entire Bill',
    type: 'spin',
    status: 'issued',
    claimedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  };

  const sampleRedeemedReward: Reward = {
    id: 'rew_sample_redeemed_1',
    businessId: 'biz_bella_napoli',
    customerId: 'cust_sarah',
    customerName: 'Sarah Jenkins',
    customerMobileMasked: '******6789',
    code: 'SY-SARAH3',
    title: 'Free Wood-Fired Margherita Pizza',
    type: 'loyalty',
    status: 'redeemed',
    claimedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
    staffPinVerifiedBy: 'Staff Terminal NY',
  };

  const sampleReviewLog: ReviewLog = {
    id: 'rev_sample_1',
    businessId: 'biz_bella_napoli',
    customerId: 'cust_marco',
    customerName: 'Marco Rossi',
    reviewText: 'Outstanding wood-fired crust! The staff is incredibly friendly and welcoming.',
    rating: 5,
    tags: ['Great Service', 'Delicious Pizza', 'Authentic Taste'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    googleReviewOpenedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 4000).toISOString(),
    status: 'google_opened',
  };

  return {
    businesses: [business1, business2],
    offers: [offer1, offer2],
    merchantEntries: [entry1_qr, entry1_nfc, entry1_loyalty, entry2_qr],
    customers,
    rewards: [sampleReward, sampleRedeemedReward],
    reviewLogs: [sampleReviewLog],
  };
}
