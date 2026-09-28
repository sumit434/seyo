import { db, IBusiness } from '../config/db.js';
import { hashPassword } from '../utils/password.js';
import { hashPin } from '../utils/pin.js';

export function seedDatabase() {
  // If businesses are already seeded, do not duplicate
  if (db.businesses.size > 0) return;

  const defaultBusinesses: IBusiness[] = [
    {
      id: 'biz_rustic_fork',
      name: 'The Rustic Fork Bistro',
      slug: 'rustic-fork',
      email: 'manager@rusticfork.com',
      passwordHash: hashPassword('password123'),
      staffPinHash: hashPin('1234'),
      tier: 'combined',
      timezone: 'Asia/Kolkata',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      loyaltyTarget: 5,
      loyaltyReward: 'Free Signature Artisan Pizza & Handcrafted Dessert',
      category: 'Artisanal Italian & Craft Dining',
      logoEmoji: '🍕',
      address: '42 Heritage Boulevard, Downtown Square',
      accentColor: '#0e7c66',
      active: true,
      spinWheelConfiguration: [
        { id: 'sw_1', rewardLabel: '20% Off Main Course', emoji: '🍝', weight: 30 },
        { id: 'sw_2', rewardLabel: 'Free Craft Mocktail', emoji: '🍹', weight: 25 },
        { id: 'sw_3', rewardLabel: 'Crispy Bruschetta Platter', emoji: '🥖', weight: 20 },
        { id: 'sw_4', rewardLabel: '15% Off Total Dining Bill', emoji: '🎟️', weight: 15 },
        { id: 'sw_5', rewardLabel: 'Double Loyalty Stamp Today', emoji: '⭐', weight: 7 },
        { id: 'sw_6', rewardLabel: 'Free Gelato Trio', emoji: '🍨', weight: 3 },
      ],
    },
    {
      id: 'biz_brew_co',
      name: 'Brew & Co. Specialty Coffee',
      slug: 'brew-co',
      email: 'manager@brewco.com',
      passwordHash: hashPassword('password123'),
      staffPinHash: hashPin('2468'),
      tier: 'loyalty',
      timezone: 'Asia/Kolkata',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      loyaltyTarget: 6,
      loyaltyReward: 'Complimentary Single-Origin Pour Over & Fresh Croissant',
      category: 'Specialty Roastery & Espresso Bar',
      logoEmoji: '☕',
      address: '18 Roaster Lane, Arts District',
      accentColor: '#0e7c66',
      active: true,
      spinWheelConfiguration: [
        { id: 'sw_b1', rewardLabel: 'Free Upgrade to Large', emoji: '☕', weight: 40 },
        { id: 'sw_b2', rewardLabel: 'Free Butter Croissant', emoji: '🥐', weight: 30 },
        { id: 'sw_b3', rewardLabel: '20% Off Bag of Beans', emoji: '📦', weight: 30 },
      ],
    },
    {
      id: 'biz_velvet_lounge',
      name: 'Velvet Lounge & Tapas',
      slug: 'velvet-lounge',
      email: 'manager@velvetlounge.com',
      passwordHash: hashPassword('password123'),
      staffPinHash: hashPin('7777'),
      tier: 'spin',
      timezone: 'Asia/Kolkata',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      loyaltyTarget: 5,
      loyaltyReward: 'VIP Cocktail Platter',
      category: 'Cocktails & Evening Tapas',
      logoEmoji: '🍸',
      address: '77 High Street, Waterfront Promenade',
      accentColor: '#0e7c66',
      active: true,
      spinWheelConfiguration: [
        { id: 'sw_v1', rewardLabel: '1 Free Tapas Dish', emoji: '🍢', weight: 35 },
        { id: 'sw_v2', rewardLabel: 'Signature Welcome Cocktail', emoji: '🍸', weight: 25 },
        { id: 'sw_v3', rewardLabel: '20% Off Evening Check', emoji: '✨', weight: 25 },
        { id: 'sw_v4', rewardLabel: 'Free Churros with Dark Chocolate', emoji: '🍫', weight: 15 },
      ],
    },
    {
      id: 'biz_glow_salon',
      name: 'Glow Hair & Wellness Studio',
      slug: 'glow-salon',
      email: 'manager@glowsalon.com',
      passwordHash: hashPassword('password123'),
      staffPinHash: hashPin('9999'),
      tier: 'review',
      timezone: 'Asia/Kolkata',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      loyaltyTarget: 4,
      loyaltyReward: 'Free Botanical Hair Spa Treatment',
      category: 'Luxury Salon & Wellness',
      logoEmoji: '✨',
      address: '104 Bloom Avenue, Suite 3B',
      accentColor: '#0e7c66',
      active: true,
      spinWheelConfiguration: [
        { id: 'sw_g1', rewardLabel: '15% Off Any Service', emoji: '💇‍♀️', weight: 50 },
        { id: 'sw_g2', rewardLabel: 'Free Conditioning Treatment', emoji: '💆‍♀️', weight: 50 },
      ],
    },
  ];

  for (const b of defaultBusinesses) {
    db.businesses.set(b.id, b);

    // Seed active campaign offer for this business
    const offerId = `off_${b.id}_launch`;
    if (!db.offers.has(offerId)) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
      db.offers.set(offerId, {
        id: offerId,
        businessId: b.id,
        title: `${b.name} Grand Engagement Campaign`,
        description: 'Primary customer reward and review acceleration campaign.',
        tier: b.tier,
        status: 'active',
        createdAt: now.toISOString(),
        activatedAt: now.toISOString(),
        expiresAt,
        cancelledAt: null,
        durationDays: 30,
        spinWheelConfiguration: b.spinWheelConfiguration,
        loyaltyTarget: b.loyaltyTarget,
        loyaltyReward: b.loyaltyReward,
        metrics: {
          scans: 12,
          identifiedGuests: 8,
          rewardsIssued: 6,
          rewardsRedeemed: 4,
          reviewsPrompted: 5,
          reviewsPersisted: 3,
        },
      });
    }
  }

  db.saveToDisk();
}
