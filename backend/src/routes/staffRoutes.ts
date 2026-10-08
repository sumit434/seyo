import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { StaffService } from '../services/staffService';
import { MemoryDB } from '../db/MemoryDB';
import { staffAuthMiddleware, AuthenticatedStaffRequest } from '../middleware/staffMiddleware';
import { maskMobile, extractConfiguredPin } from '../utils/crypto';
import { Offer } from '../../../shared/types/offer';
import { validateTierConfiguration } from '../../../shared/validation/offerValidation';

const router = Router();
const staffService = new StaffService();
const db = MemoryDB.getInstance();

// Staff Login
router.post('/login', (req: Request, res: Response, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password are required' });
    }
    const result = staffService.login(identifier, password);
    res.json({
      success: true,
      sessionToken: result.session.sessionId,
      businessId: result.session.businessId,
      businessName: result.session.businessName,
      businessSlug: result.session.businessSlug,
      tier: result.session.tier,
      expiresAt: result.session.expiresAt,
    });
  } catch (err) {
    next(err);
  }
});

// Staff Terminal Data (Protected)
router.get('/terminal-data', staffAuthMiddleware, async (req: AuthenticatedStaffRequest, res: Response, next) => {
  try {
    const businessId = req.staffSession!.businessId;
    const business = db.getBusinessById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const offer = db.getActiveOfferByBusinessId(businessId) || null;
    let entries = db.getMerchantEntriesByBusinessId(businessId);

    // Normalize entries for Combined Tier to guarantee the 3 entry options
    if (business.tier === 'combined') {
      let qrEntry = entries.find(e => e.entryType === 'merchant_qr');
      if (!qrEntry) {
        qrEntry = {
          id: `entry_qr_${business.id}`,
          businessId: business.id,
          businessSlug: business.slug,
          entryType: 'merchant_qr',
          label: 'Dynamic QR',
          permanentCode: `${business.slug.toUpperCase()}-QR`,
          targetTier: 'combined',
          createdAt: new Date().toISOString(),
        };
        db.saveMerchantEntry(qrEntry);
        entries.push(qrEntry);
      } else {
        qrEntry.label = 'Dynamic QR';
      }

      let nfcEntry = entries.find(e => e.entryType === 'nfc_tag' || e.entryType === 'combined');
      if (!nfcEntry) {
        nfcEntry = {
          id: `entry_nfc_${business.id}`,
          businessId: business.id,
          businessSlug: business.slug,
          entryType: 'combined',
          label: 'Physical NFC Tag',
          permanentCode: `${business.slug.toUpperCase()}-NFC`,
          targetTier: 'combined',
          createdAt: new Date().toISOString(),
        };
        db.saveMerchantEntry(nfcEntry);
        entries.push(nfcEntry);
      } else {
        nfcEntry.label = 'Physical NFC Tag';
        nfcEntry.entryType = 'combined';
      }

      let loyaltyEntry = entries.find(e => e.entryType === 'loyalty' || e.entryType === 'instant_loyalty');
      if (!loyaltyEntry) {
        loyaltyEntry = {
          id: `entry_loyalty_${business.id}`,
          businessId: business.id,
          businessSlug: business.slug,
          entryType: 'loyalty',
          label: 'Express Loyalty NFC Tag',
          permanentCode: `${business.slug.toUpperCase()}-LOYALTY`,
          targetTier: 'combined',
          createdAt: new Date().toISOString(),
        };
        db.saveMerchantEntry(loyaltyEntry);
        entries.push(loyaltyEntry);
      } else {
        loyaltyEntry.label = 'Express Loyalty NFC Tag';
        loyaltyEntry.entryType = 'loyalty';
      }

      // Order: Dynamic QR -> Physical NFC Tag -> Express Loyalty NFC Tag
      entries.sort((a, b) => {
        const order: Record<string, number> = {
          merchant_qr: 1,
          combined: 2,
          nfc_tag: 2,
          loyalty: 3,
          instant_loyalty: 3,
        };
        return (order[a.entryType] || 99) - (order[b.entryType] || 99);
      });
    } else {
      // Individual tiers: Main Counter Printed QR (Dynamic QR) + Physical NFC Tag
      let qrEntry = entries.find(e => e.entryType === 'merchant_qr');
      if (!qrEntry) {
        qrEntry = {
          id: `entry_qr_${business.id}`,
          businessId: business.id,
          businessSlug: business.slug,
          entryType: 'merchant_qr',
          label: 'Dynamic QR',
          permanentCode: `${business.slug.toUpperCase()}-QR`,
          targetTier: business.tier,
          createdAt: new Date().toISOString(),
        };
        db.saveMerchantEntry(qrEntry);
        entries.push(qrEntry);
      } else {
        qrEntry.label = 'Dynamic QR';
      }

      let nfcEntry = entries.find(e => e.entryType === 'nfc_tag' || e.entryType === 'combined');
      if (!nfcEntry) {
        nfcEntry = {
          id: `entry_nfc_${business.id}`,
          businessId: business.id,
          businessSlug: business.slug,
          entryType: 'nfc_tag',
          label: 'Physical NFC Tag',
          permanentCode: `${business.slug.toUpperCase()}-NFC`,
          targetTier: business.tier,
          createdAt: new Date().toISOString(),
        };
        db.saveMerchantEntry(nfcEntry);
        entries.push(nfcEntry);
      } else {
        nfcEntry.label = 'Physical NFC Tag';
      }

      entries.sort((a, b) => {
        const order: Record<string, number> = {
          merchant_qr: 1,
          nfc_tag: 2,
          combined: 2,
        };
        return (order[a.entryType] || 99) - (order[b.entryType] || 99);
      });
    }

    const customers = db.getCustomersByBusinessId(businessId);
    const rawRewards = db.getRewardsByBusinessId(businessId);
    const rewards = rawRewards.map(r => {
      const cust = db.getCustomerById(r.customerId);
      const fullMobile = cust?.mobile || r.customerMobileMasked || '';
      return {
        ...r,
        customerName: cust?.name || r.customerName || 'Guest',
        customerMobile: fullMobile,
        customerMobileMasked: fullMobile,
      };
    });
    const reviews = db.getReviewLogsByBusinessId(businessId);

    // Format loyalty records - show complete mobile number for staff record log
    const loyaltyTarget = offer?.loyaltyTarget || business.loyaltyTarget || 6;
    const loyaltyRecords = customers.map(c => ({
      id: c.id,
      name: c.name || 'Guest',
      mobile: c.mobile,
      mobileMasked: c.mobile, // Full complete mobile number for staff record log
      visitCount: c.visitCount || 0,
      target: loyaltyTarget,
      totalVisits: c.totalVisits || 0,
      lastVisitAt: c.lastVisitAt,
    })).sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0));

    // Generate QR data URLs for entries
    let baseUrl = process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
      ? process.env.APP_URL.replace(/\/$/, '')
      : '';

    if (!baseUrl) {
      const forwardedHost = req.get('x-forwarded-host');
      const forwardedProto = req.get('x-forwarded-proto') || (req.protocol === 'https' ? 'https' : 'http');
      if (forwardedHost) {
        baseUrl = `${forwardedProto}://${forwardedHost}`;
      } else {
        const host = req.get('host') || 'localhost:3000';
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        baseUrl = `${protocol}://${host}`;
      }
    }

    const entriesWithQr = await Promise.all(
      entries.map(async entry => {
        let customerUrl = `${baseUrl}/c/${business.slug}/v`;
        let sessionKey: string | undefined;
        let expiresAt: string | undefined;

        if (entry.entryType === 'merchant_qr') {
          let activeQrSession = db.getActiveQrSessionForBusiness(business.id);
          if (!activeQrSession) {
            activeQrSession = db.createQrSession(business.id, offer?.id || '');
          }
          sessionKey = activeQrSession.sessionKey;
          expiresAt = activeQrSession.expiresAt;
          customerUrl = `${baseUrl}/c/${business.slug}/v?sk=${activeQrSession.sessionKey}`;
        } else if (entry.entryType === 'loyalty' || entry.entryType === 'instant_loyalty') {
          customerUrl = `${baseUrl}/api/entry/tap/${business.slug}?mode=loyalty`;
        } else {
          customerUrl = `${baseUrl}/api/entry/tap/${business.slug}`;
        }

        let qrDataUrl = '';
        try {
          qrDataUrl = await QRCode.toDataURL(customerUrl, {
            margin: 1,
            width: 280,
            color: { dark: '#0e7c66', light: '#ffffff' },
          });
        } catch (e) {
          // ignore qr generation error
        }
        return {
          ...entry,
          customerUrl,
          qrDataUrl,
          sessionKey,
          expiresAt,
        };
      })
    );

    res.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        email: business.email,
        tier: business.tier,
        category: business.category,
        city: business.city,
        country: business.country,
        timezone: business.timezone,
        logoEmoji: business.logoEmoji,
        logoUrl: business.logoUrl,
        accentColor: business.accentColor,
        loyaltyTarget: business.loyaltyTarget,
        loyaltyValidationDays: business.loyaltyValidationDays,
        loyaltyReward: business.loyaltyReward,
        spinWheelConfiguration: business.spinWheelConfiguration,
        googleReviewUrl: business.googleReviewUrl,
        configuredStaffPin: extractConfiguredPin(business.staffPinHash) || '••••',
      },
      offer: offer ? {
        id: offer.id,
        title: offer.title,
        tier: offer.tier,
        status: offer.status,
        createdAt: offer.createdAt,
        activatedAt: offer.activatedAt,
        spinWheelConfiguration: offer.spinWheelConfiguration,
        loyaltyTarget: offer.loyaltyTarget,
        loyaltyValidationDays: offer.loyaltyValidationDays,
        loyaltyReward: offer.loyaltyReward,
        metrics: offer.metrics,
      } : null,
      entries: entriesWithQr,
      loyaltyRecords,
      rewards,
      reviews,
      offerHistory: staffService.getOfferHistory(business.id),
    });
  } catch (err) {
    next(err);
  }
});

// Redeem Customer Reward Voucher with 4-digit PIN
router.post('/redeem-voucher', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response, next) => {
  try {
    const businessId = req.staffSession!.businessId;
    const { voucherCode, staffPin } = req.body;

    if (!voucherCode || !staffPin) {
      return res.status(400).json({ success: false, message: 'voucherCode and staffPin are required' });
    }

    const cleanPin = String(staffPin).trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      return res.status(400).json({ success: false, message: 'Staff verification PIN must be exactly 4 digits' });
    }

    const result = staffService.redeemVoucher(businessId, String(voucherCode).trim(), cleanPin);
    res.json({
      success: true,
      message: `Voucher ${result.reward.code} successfully redeemed for ${result.customerName}`,
      reward: result.reward,
    });
  } catch (err) {
    next(err);
  }
});

// Delete / Deactivate active offer (preserves history, transitions offer status to cancelled)
router.post(['/delete-offer', '/cancel-offer'], staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response, next) => {
  try {
    const businessId = req.staffSession!.businessId;
    const result = staffService.deleteActiveOffer(businessId);

    res.json({
      success: true,
      message: 'Active offer has been deactivated and archived in Offer History.',
      offer: result.offer,
    });
  } catch (err) {
    next(err);
  }
});

// Get business offer history (Strictly business-scoped)
router.get('/offer-history', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response, next) => {
  try {
    const businessId = req.staffSession!.businessId;
    const offers = staffService.getOfferHistory(businessId);
    res.json({
      success: true,
      offers,
    });
  } catch (err) {
    next(err);
  }
});

// Activate new offer/campaign for the business matching its tier plan
router.post('/activate-offer', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response, next) => {
  try {
    const businessId = req.staffSession!.businessId;
    const business = db.getBusinessById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const {
      title,
      description,
      spinWheelConfiguration,
      loyaltyTarget,
      loyaltyValidationDays,
      loyaltyReward,
      googleReviewUrl,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Offer/Campaign title is required' });
    }

    // Validate tier plan specific configuration
    const valResult = validateTierConfiguration(business.tier, {
      spinWheelConfiguration: spinWheelConfiguration || business.spinWheelConfiguration,
      loyaltyTarget: loyaltyTarget !== undefined ? Number(loyaltyTarget) : business.loyaltyTarget,
      loyaltyValidationDays: loyaltyValidationDays !== undefined ? Number(loyaltyValidationDays) : business.loyaltyValidationDays,
      loyaltyReward: loyaltyReward || business.loyaltyReward,
      googleReviewUrl: googleReviewUrl || business.googleReviewUrl,
    });

    if (!valResult.valid) {
      return res.status(400).json({ success: false, message: valResult.error });
    }

    const newOffer = staffService.createAndActivateOffer(businessId, {
      title,
      description,
      spinWheelConfiguration,
      loyaltyTarget: loyaltyTarget !== undefined ? Number(loyaltyTarget) : undefined,
      loyaltyValidationDays: loyaltyValidationDays !== undefined ? Number(loyaltyValidationDays) : undefined,
      loyaltyReward,
      googleReviewUrl,
    });

    res.json({
      success: true,
      message: 'New offer successfully activated!',
      offer: newOffer,
    });
  } catch (err: any) {
    if (err.message && err.message.startsWith('ACTIVE_OFFER_EXISTS')) {
      return res.status(409).json({ success: false, message: err.message });
    }
    next(err);
  }
});


// Refresh Dynamic Counter QR session key
router.post('/qr/refresh', staffAuthMiddleware, async (req: AuthenticatedStaffRequest, res: Response, next) => {
  try {
    const businessId = req.staffSession!.businessId;
    const business = db.getBusinessById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }
    const offer = db.getActiveOfferByBusinessId(businessId);

    // 1. Invalidate previous unused QR session keys for this business
    db.invalidateUnusedQrSessions(businessId);

    // 2. Generate new 15-minute QR session key
    const newSession = db.createQrSession(businessId, offer?.id || '');

    // 3. Compute base URL
    let baseUrl = process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
      ? process.env.APP_URL.replace(/\/$/, '')
      : '';

    if (!baseUrl) {
      const forwardedHost = req.get('x-forwarded-host');
      const forwardedProto = req.get('x-forwarded-proto') || (req.protocol === 'https' ? 'https' : 'http');
      if (forwardedHost) {
        baseUrl = `${forwardedProto}://${forwardedHost}`;
      } else {
        const host = req.get('host') || 'localhost:3000';
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        baseUrl = `${protocol}://${host}`;
      }
    }

    // 4. Generate new Customer URL
    const customerUrl = `${baseUrl}/c/${business.slug}/v?sk=${newSession.sessionKey}`;

    // 5. Generate new QR data URL
    const qrDataUrl = await QRCode.toDataURL(customerUrl, {
      margin: 1,
      width: 280,
      color: { dark: '#0e7c66', light: '#ffffff' },
    });

    res.json({
      success: true,
      sessionKey: newSession.sessionKey,
      customerUrl,
      qrDataUrl,
      expiresAt: newSession.expiresAt,
    });
  } catch (err) {
    next(err);
  }
});

// Helper route to generate standalone QR code for any URL
router.get('/qr-code', async (req: Request, res: Response, next) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }
    const qrDataUrl = await QRCode.toDataURL(url, {
      margin: 1,
      width: 320,
      color: { dark: '#10181c', light: '#ffffff' },
    });
    res.json({ success: true, qrDataUrl });
  } catch (err) {
    next(err);
  }
});

// Update Merchant Profile and Branding (Protected, Isolated to authenticated merchant)
router.put('/profile', staffAuthMiddleware, (req: AuthenticatedStaffRequest, res: Response, next) => {
  try {
    const businessId = req.staffSession!.businessId;
    const business = db.getBusinessById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const {
      name,
      logoEmoji,
      logoUrl,
      googleReviewUrl,
      instagramUrl,
      websiteUrl,
      facebookUrl,
      zomatoUrl,
      swiggyUrl,
      accentColor,
    } = req.body;

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName) {
        return res.status(400).json({ success: false, message: 'Business name cannot be empty' });
      }
      business.name = cleanName;
    }

    if (logoEmoji !== undefined) {
      business.logoEmoji = String(logoEmoji).trim() || '🏪';
    }

    if (logoUrl !== undefined) {
      business.logoUrl = String(logoUrl).trim();
    }

    if (googleReviewUrl !== undefined) {
      business.googleReviewUrl = String(googleReviewUrl).trim();
    }

    if (instagramUrl !== undefined) {
      business.instagramUrl = String(instagramUrl).trim();
    }

    if (websiteUrl !== undefined) {
      (business as any).websiteUrl = String(websiteUrl).trim();
    }

    if (facebookUrl !== undefined) {
      (business as any).facebookUrl = String(facebookUrl).trim();
    }

    if (zomatoUrl !== undefined) {
      business.zomatoUrl = String(zomatoUrl).trim();
    }

    if (swiggyUrl !== undefined) {
      business.swiggyUrl = String(swiggyUrl).trim();
    }

    if (accentColor !== undefined && accentColor) {
      business.accentColor = String(accentColor).trim();
    }

    business.updatedAt = new Date().toISOString();
    db.saveBusiness(business);

    res.json({
      success: true,
      message: 'Merchant profile and branding updated successfully',
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        email: business.email,
        tier: business.tier,
        category: business.category,
        city: business.city,
        country: business.country,
        timezone: business.timezone,
        logoEmoji: business.logoEmoji,
        logoUrl: business.logoUrl,
        accentColor: business.accentColor,
        googleReviewUrl: business.googleReviewUrl,
        instagramUrl: business.instagramUrl,
        websiteUrl: (business as any).websiteUrl,
        facebookUrl: (business as any).facebookUrl,
        zomatoUrl: business.zomatoUrl,
        swiggyUrl: business.swiggyUrl,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
