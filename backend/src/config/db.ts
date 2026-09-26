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
  tier: 'combined' | 'spin' | 'loyalty' | 'review' | 'spin-review' | 'loyalty-review';
  timezone: string;
  googleReviewUrl: string;
  googlePlaceId: string;
  loyaltyTarget: number;
  loyaltyReward: string;
  spinWheelConfiguration: SpinWheelSlice[];
  active: boolean;
  category: string;
  logoEmoji: string;
  address: string;
  accentColor: string;
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
  type: 'spin' | 'loyalty' | 'combined' | 'spin-review' | 'loyalty-review' | 'review';
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
      }
    } catch {
      // In case of corrupt file or parse error, proceed with fresh maps
    }
  }

  // Periodic TTL cleanup for expired QR codes and staff sessions
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
  }
}

export const db = new MemoryDB();

// Clean expired records every 60 seconds
setInterval(() => {
  db.cleanExpired();
}, 60000);