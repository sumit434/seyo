import { Router, Request, Response } from 'express';
import { CustomerSessionService } from '../services/customerSessionService';
import { CustomerStatusService } from '../services/customerStatusService';
import { MemoryDB } from '../db/MemoryDB';

const router = Router();
const sessionService = new CustomerSessionService();
const statusService = new CustomerStatusService();
const db = MemoryDB.getInstance();

/**
 * Permanent NFC Tap Handler
 * Conceptually: NTAG213 -> /api/entry/tap/:slug
 * Validates merchant/NFC entry, creates a NEW 3-minute session key,
 * and redirects customer to /c/:slug?sk=<new-session-key>
 */
router.get(['/tap/:identifier', '/tap/:identifier/:subpath'], (req: Request, res: Response, next) => {
  try {
    const { identifier, subpath } = req.params;
    const { business, offer, entry, isActive } = sessionService.resolveMerchant(identifier);

    if (!business) {
      return res.status(404).send('Business not found');
    }

    if (!isActive || !offer) {
      // Inactive offer fallback -> redirect to merchant view
      return res.redirect(302, `/c/${business.slug}/v`);
    }

    const isLoyalty =
      subpath === 'loyalty' ||
      req.query.mode === 'loyalty' ||
      req.query.entryType === 'loyalty' ||
      entry?.entryType === 'loyalty' ||
      entry?.entryType === 'instant_loyalty';

    const effectiveEntryType: 'combined' | 'loyalty' = isLoyalty ? 'loyalty' : 'combined';

    // Generate fresh session with authoritative 3-minute TTL
    const session = sessionService.createNfcSession(business.id, offer.id, effectiveEntryType);

    // Redirect to customer flow with ?sk=<new-session-key>
    const targetPath = isLoyalty ? `/c/${business.slug}/loyalty` : `/c/${business.slug}/v`;
    return res.redirect(302, `${targetPath}?sk=${encodeURIComponent(session.sessionKey)}`);
  } catch (err) {
    next(err);
  }
});

// Resolve QR/NFC entry
router.get('/resolve/:identifier', (req: Request, res: Response, next) => {
  try {
    const { identifier } = req.params;
    const sk = (req.query.sk || req.query.sessionKey || req.query.key || req.query.token) as string | undefined;

    const { business, offer, entry, isActive } = sessionService.resolveMerchant(identifier);

    if (!isActive || !offer) {
      return res.json({
        success: true,
        isActive: false,
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          category: business.category,
          logoEmoji: business.logoEmoji,
          logoUrl: business.logoUrl,
          accentColor: business.accentColor,
        },
        offer: null,
        message: 'No active offers currently running for this business.',
      });
    }

    const requestedEntryType = (req.query.entryType as string) || (entry?.entryType === 'loyalty' || entry?.entryType === 'instant_loyalty' ? 'loyalty' : 'combined');
    const effectiveEntryType: 'combined' | 'loyalty' = requestedEntryType === 'loyalty' ? 'loyalty' : 'combined';

    // If no session key provided: PERMANENT BASE URL IS VIEW-ONLY
    // Must NOT create a claimable session.
    if (!sk) {
      const statusPayload = statusService.formatStatusResponse(business, offer, null, effectiveEntryType);
      return res.json({
        success: true,
        isActive: true,
        isViewOnly: true,
        sessionToken: null,
        sessionKey: null,
        entryType: effectiveEntryType,
        ...statusPayload,
        status: {
          ...statusPayload.status,
          claimAvailable: false,
          isViewOnly: true,
        },
      });
    }

    const session = db.getCustomerSession(sk);

    if (!session) {
      return res.status(403).json({
        success: false,
        error: 'SESSION_EXPIRED',
        message: 'Token already used or expired',
      });
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      return res.status(403).json({
        success: false,
        error: 'SESSION_EXPIRED',
        message: 'Token already used or expired',
      });
    }

    if (session.status === 'completed') {
      return res.status(403).json({
        success: false,
        error: 'SESSION_ALREADY_USED',
        message: 'Token already used or expired',
      });
    }

    if (!session.entryType) {
      session.entryType = effectiveEntryType;
      db.saveCustomerSession(session);
    }

    // Initial status without logged-in customer
    const sessionEntryType = session.entryType || effectiveEntryType;
    const statusPayload = statusService.formatStatusResponse(business, offer, null, sessionEntryType);

    res.json({
      success: true,
      isActive: true,
      isViewOnly: false,
      sessionToken: session.sessionToken,
      sessionKey: session.sessionKey,
      entryType: sessionEntryType,
      ...statusPayload,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
