import fs from 'fs';
import path from 'path';

export interface SpinWheelSlice {
  id: string;
  rewardLabel: string;
  emoji: string;
  weight: number;
}

export interface IBusiness {
  id: string;
  name: string;
  slug: string;
  email: string;
  passwordHash: string;
  staffPinHash: string;
  tier: 'combined' | 'spin' | 'loyalty' | 'review';
  timezone: string;
  googleReviewUrl: string;
  googlePlaceId: string;
  loyaltyTarget: number;
  loyaltyReward: string;
  spinWheelConfiguration: SpinWheelSlice[];
  active: boolean;
  category: string;
  logoEmoji: string;
  logoUrl?: string; // Uploaded custom brand logo image (base64 or URL)
  address: string;
  accentColor: string;
  createdAt?: string;
}

export type OfferStatus = 'no_offer' | 'draft' | 'active' | 'completed' | 'cancelled';

export interface IOffer {
  id: string;
  businessId: string;
  title: string;
  description?: string;
  tier: 'combined' | 'spin' | 'loyalty' | 'review';
  status: OfferStatus;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  cancelledAt: string | null;
  durationDays: number;
  spinWheelConfiguration?: SpinWheelSlice[];
  loyaltyTarget?: number;
  loyaltyReward?: string;
  metrics: {
    scans: number;
    identifiedGuests: number;
    rewardsIssued: number;
    rewardsRedeemed: number;
    reviewsPrompted: number;
    reviewsPersisted: number;
  };
}

export interface IOnboardingToken {
  token: string;
  email: string;
  tier: 'combined' | 'spin' | 'loyalty' | 'review';
  businessName?: string;
  status: 'pending' | 'completed' | 'expired';
  createdAt: string;
  expiresAt: string; // 15-minute TTL
  completedAt?: string | null;
  businessId?: string | null;
}

export interface ICustomer {
  id: string;
  businessId: string;
  mobile: string;
  name: string;
  visitCount: number; // Current loyalty cycle visits
  totalVisits: number; // Cumulative lifetime visits
  lastVisitAt: string | null;
  totalRewardsClaimed: number;
  lastSpinAt: string | null;
  totalSpins: number;
  activeVoucher: {
    code: string;
    title: string;
    type: 'spin' | 'loyalty';
    claimedAt: string;
    rewardId: string;
  } | null;
  reviewJourneyCompleted: boolean;
  reviewJourneyCompletedAt: string | null;
  createdAt: string;
}

export interface IDynamicQR {
  id: string;
  key: string;
  businessId: string;
  type: 'spin' | 'loyalty' | 'combined';
  isUsed: boolean;
  usedBy: string | null; // CustomerId
  createdAt: string;
  expiresAt: string; // ISO string
}

export interface IReward {
  id: string;
  businessId: string;
  customerId: string;
  code: string;
  title: string;
  type: 'spin' | 'loyalty';
  status: 'active' | 'redeemed' | 'expired';
  claimedAt: string;
  redeemedAt: string | null;
  staffPinVerifiedBy: string | null;
}

export interface IReviewLog {
  id: string;
  businessId: string;
  customerId: string;
  reviewText: string;
  rating: number;
  tags: string[];
  createdAt: string;
  googleReviewOpenedAt: string | null;
  status: 'generated' | 'persisted' | 'google_opened';
}

export interface IStaffSession {
  token: string;
  businessId: string;
  tier: string;
  createdAt: string;
  expiresAt: string;
}

// In-Memory Database Store with JSON persistence capability
class MemoryDB {
  businesses: Map<string, IBusiness> = new Map();
  customers: Map<string, ICustomer> = new Map(); // key: `${businessId}:${mobile}`
  qrCodes: Map<string, IDynamicQR> = new Map(); // key: token key
  rewards: Map<string, IReward> = new Map(); // key: reward id
  reviewLogs: Map<string, IReviewLog> = new Map(); // key: review id
  staffSessions: Map<string, IStaffSession> = new Map(); // key: session token
  offers: Map<string, IOffer> = new Map(); // key: offer id
  onboardingTokens: Map<string, IOnboardingToken> = new Map(); // key: onboarding token

  private dataFilePath: string = path.resolve(process.cwd(), '.seyo_db_store.json');

  constructor() {
    this.loadFromDisk();
  }

  saveToDisk() {
    try {
      const payload = {
        businesses: Array.from(this.businesses.entries()),
        customers: Array.from(this.customers.entries()),
        qrCodes: Array.from(this.qrCodes.entries()),
        rewards: Array.from(this.rewards.entries()),
        reviewLogs: Array.from(this.reviewLogs.entries()),
        staffSessions: Array.from(this.staffSessions.entries()),
        offers: Array.from(this.offers.entries()),
        onboardingTokens: Array.from(this.onboardingTokens.entries()),
      };
      fs.writeFileSync(this.dataFilePath, JSON.stringify(payload, null, 2));
    } catch {
      // Disk write failure fallback
    }
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const data = JSON.parse(raw);
        if (data.businesses) this.businesses = new Map(data.businesses);
        if (data.customers) this.customers = new Map(data.customers);
        if (data.qrCodes) this.qrCodes = new Map(data.qrCodes);
        if (data.rewards) this.rewards = new Map(data.rewards);
        if (data.reviewLogs) this.reviewLogs = new Map(data.reviewLogs);
        if (data.staffSessions) this.staffSessions = new Map(data.staffSessions);
        if (data.offers) this.offers = new Map(data.offers);
        if (data.onboardingTokens) this.onboardingTokens = new Map(data.onboardingTokens);
      }
    } catch {
      // In case of corrupt file or parse error, proceed with fresh maps
    }
  }

  // Periodic TTL cleanup for expired QR codes, onboarding tokens, and staff sessions
  cleanExpired() {
    const now = new Date().toISOString();
    for (const [k, qr] of this.qrCodes.entries()) {
      if (qr.expiresAt < now) {
        this.qrCodes.delete(k);
      }
    }
    for (const [t, s] of this.staffSessions.entries()) {
      if (s.expiresAt < now) {
        this.staffSessions.delete(t);
      }
    }
    for (const [tok, onb] of this.onboardingTokens.entries()) {
      if (onb.expiresAt < now && onb.status === 'pending') {
        onb.status = 'expired';
      }
    }
    // Check offer natural expirations
    for (const [, off] of this.offers.entries()) {
      if (off.status === 'active' && off.expiresAt && off.expiresAt < now) {
        off.status = 'completed';
      }
    }
  }
}

export const db = new MemoryDB();

// Clean expired records every 60 seconds
setInterval(() => {
  db.cleanExpired();
}, 60000);
