import { db, IStaffSession } from '../config/db.js';
import { generateSecureKey } from '../utils/crypto.js';
import { verifyPassword } from '../utils/password.js';

export function authenticateStaff(email: string, password: string) {
  for (const b of db.businesses.values()) {
    if (b.email.toLowerCase() === email.toLowerCase() && b.active) {
      if (verifyPassword(password, b.passwordHash)) {
        const token = `stf_${generateSecureKey(16)}`;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24hr session

        const session: IStaffSession = {
          token,
          businessId: b.id,
          tier: b.tier,
          createdAt: now.toISOString(),
          expiresAt,
        };

        db.staffSessions.set(token, session);
        db.saveToDisk();

        return {
          success: true,
          token,
          business: {
            id: b.id,
            name: b.name,
            slug: b.slug,
            tier: b.tier,
            category: b.category,
            logoEmoji: b.logoEmoji,
            timezone: b.timezone,
            loyaltyTarget: b.loyaltyTarget,
            loyaltyReward: b.loyaltyReward,
          },
        };
      }
    }
  }

  return { success: false, message: 'Invalid business email or password.' };
}

export function verifyStaffSession(token: string): IStaffSession | null {
  if (!token) return null;
  const session = db.staffSessions.get(token);
  if (!session) return null;
  if (session.expiresAt < new Date().toISOString()) {
    db.staffSessions.delete(token);
    db.saveToDisk();
    return null;
  }
  return session;
}
