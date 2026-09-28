import { db, IOffer, OfferStatus, SpinWheelSlice } from '../config/db.js';
import { generateSecureKey } from '../utils/crypto.js';
import { getBusinessById } from './businessService.js';

export function getActiveOffer(businessId: string): IOffer | null {
  const now = new Date().toISOString();
  for (const offer of db.offers.values()) {
    if (offer.businessId === businessId && offer.status === 'active') {
      if (offer.expiresAt && offer.expiresAt < now) {
        offer.status = 'completed';
        db.saveToDisk();
        continue;
      }
      return offer;
    }
  }
  return null;
}

export function listOffersForBusiness(businessId: string): IOffer[] {
  const now = new Date().toISOString();
  const list: IOffer[] = [];
  for (const offer of db.offers.values()) {
    if (offer.businessId === businessId) {
      if (offer.status === 'active' && offer.expiresAt && offer.expiresAt < now) {
        offer.status = 'completed';
      }
      list.push(offer);
    }
  }
  // Sort latest first
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createDraftOffer(
  businessId: string,
  data: {
    title: string;
    description?: string;
    durationDays?: number;
    spinWheelConfiguration?: SpinWheelSlice[];
    loyaltyTarget?: number;
    loyaltyReward?: string;
  }
): { success: boolean; error?: string; offer?: IOffer } {
  const business = getBusinessById(businessId);
  if (!business) {
    return { success: false, error: 'Business not found.' };
  }

  const duration = Math.max(1, Math.min(365, Number(data.durationDays) || 30));
  const newOffer: IOffer = {
    id: `off_${generateSecureKey(8)}`,
    businessId,
    title: data.title?.trim() || `Campaign ${new Date().toLocaleDateString()}`,
    description: data.description?.trim() || '',
    tier: business.tier,
    status: 'draft',
    createdAt: new Date().toISOString(),
    activatedAt: null,
    expiresAt: null,
    cancelledAt: null,
    durationDays: duration,
    spinWheelConfiguration: data.spinWheelConfiguration || business.spinWheelConfiguration,
    loyaltyTarget: data.loyaltyTarget || business.loyaltyTarget,
    loyaltyReward: data.loyaltyReward || business.loyaltyReward,
    metrics: {
      scans: 0,
      identifiedGuests: 0,
      rewardsIssued: 0,
      rewardsRedeemed: 0,
      reviewsPrompted: 0,
      reviewsPersisted: 0,
    },
  };

  db.offers.set(newOffer.id, newOffer);
  db.saveToDisk();
  return { success: true, offer: newOffer };
}

export function updateDraftOffer(
  businessId: string,
  offerId: string,
  data: Partial<IOffer>
): { success: boolean; error?: string; offer?: IOffer } {
  const offer = db.offers.get(offerId);
  if (!offer || offer.businessId !== businessId) {
    return { success: false, error: 'Offer not found.' };
  }

  // STRICT IMMUTABILITY CHECK
  if (offer.status === 'active') {
    return {
      success: false,
      error: 'IMMUTABLE_OFFER: Active offers are locked and cannot be modified. To change rewards or probabilities, cancel this campaign and create a new offer.',
    };
  }

  if (offer.status !== 'draft') {
    return {
      success: false,
      error: `Cannot edit offer in '${offer.status}' status. Only drafts can be modified.`,
    };
  }

  if (data.title !== undefined) offer.title = data.title.trim();
  if (data.description !== undefined) offer.description = data.description.trim();
  if (data.durationDays !== undefined) offer.durationDays = Math.max(1, Math.min(365, Number(data.durationDays) || 30));
  if (data.spinWheelConfiguration !== undefined) offer.spinWheelConfiguration = data.spinWheelConfiguration;
  if (data.loyaltyTarget !== undefined) offer.loyaltyTarget = Math.max(1, Number(data.loyaltyTarget) || 5);
  if (data.loyaltyReward !== undefined) offer.loyaltyReward = data.loyaltyReward.trim();

  db.saveToDisk();
  return { success: true, offer };
}

export function activateOffer(
  businessId: string,
  offerId: string,
  confirmImmutability: boolean
): { success: boolean; error?: string; offer?: IOffer } {
  const business = getBusinessById(businessId);
  if (!business) {
    return { success: false, error: 'Business not found.' };
  }

  const offer = db.offers.get(offerId);
  if (!offer || offer.businessId !== businessId) {
    return { success: false, error: 'Offer not found.' };
  }

  if (offer.status === 'active') {
    return { success: false, error: 'This offer is already active.' };
  }

  if (!confirmImmutability) {
    return {
      success: false,
      error: 'Activation requires explicit confirmation of the Offer Immutability Rule.',
    };
  }

  // Tier validation
  if (offer.tier === 'spin' || offer.tier === 'combined') {
    const slices = offer.spinWheelConfiguration || [];
    if (slices.length < 2) {
      return { success: false, error: 'Spin & Win requires at least 2 wheel slices.' };
    }
    const totalWeight = slices.reduce((sum, s) => sum + (Number(s.weight) || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return { success: false, error: `Wheel slice weights must total exactly 100%. Current sum is ${totalWeight}%.` };
    }
  }

  if (offer.tier === 'loyalty' || offer.tier === 'combined') {
    if (!offer.loyaltyTarget || offer.loyaltyTarget < 1) {
      return { success: false, error: 'Loyalty target must be at least 1 visit.' };
    }
    if (!offer.loyaltyReward || !offer.loyaltyReward.trim()) {
      return { success: false, error: 'Loyalty milestone reward description is required.' };
    }
  }

  // Deactivate any currently active offer
  for (const existing of db.offers.values()) {
    if (existing.businessId === businessId && existing.status === 'active' && existing.id !== offerId) {
      existing.status = 'completed';
      existing.expiresAt = new Date().toISOString();
    }
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + (offer.durationDays || 30) * 24 * 60 * 60 * 1000).toISOString();

  offer.status = 'active';
  offer.activatedAt = now.toISOString();
  offer.expiresAt = expiresAt;

  // Atomically sync business live config with the active offer
  if (offer.spinWheelConfiguration) {
    business.spinWheelConfiguration = offer.spinWheelConfiguration;
  }
  if (offer.loyaltyTarget) {
    business.loyaltyTarget = offer.loyaltyTarget;
  }
  if (offer.loyaltyReward) {
    business.loyaltyReward = offer.loyaltyReward;
  }

  db.saveToDisk();
  return { success: true, offer };
}

export function cancelOffer(
  businessId: string,
  offerId: string
): { success: boolean; error?: string; offer?: IOffer } {
  const offer = db.offers.get(offerId);
  if (!offer || offer.businessId !== businessId) {
    return { success: false, error: 'Offer not found.' };
  }

  if (offer.status !== 'active') {
    return { success: false, error: 'Only active offers can be cancelled.' };
  }

  offer.status = 'cancelled';
  offer.cancelledAt = new Date().toISOString();

  db.saveToDisk();
  return { success: true, offer };
}

export function recordOfferMetric(
  businessId: string,
  metric: 'scans' | 'identifiedGuests' | 'rewardsIssued' | 'rewardsRedeemed' | 'reviewsPrompted' | 'reviewsPersisted'
) {
  const active = getActiveOffer(businessId);
  if (active) {
    if (!active.metrics) {
      active.metrics = {
        scans: 0,
        identifiedGuests: 0,
        rewardsIssued: 0,
        rewardsRedeemed: 0,
        reviewsPrompted: 0,
        reviewsPersisted: 0,
      };
    }
    active.metrics[metric] = (active.metrics[metric] || 0) + 1;
    db.saveToDisk();
  }
}
