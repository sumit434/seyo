import { db, IBusiness } from '../config/db.js';

export function getBusinessBySlug(slug: string): IBusiness | null {
  for (const b of db.businesses.values()) {
    if (b.slug.toLowerCase() === slug.toLowerCase() && b.active) {
      return b;
    }
  }
  return null;
}

export function getBusinessById(id: string): IBusiness | null {
  const b = db.businesses.get(id);
  return b && b.active ? b : null;
}

export function listAllBusinesses(): Array<Omit<IBusiness, 'passwordHash' | 'staffPinHash'>> {
  return Array.from(db.businesses.values())
    .filter(b => b.active)
    .map(({ passwordHash, staffPinHash, ...rest }) => rest);
}

export function updateBusinessBranding(
  businessId: string,
  branding: { logoUrl?: string; logoEmoji?: string; accentColor?: string; address?: string }
): IBusiness | null {
  const business = db.businesses.get(businessId);
  if (!business || !business.active) return null;

  if (branding.logoUrl !== undefined) business.logoUrl = branding.logoUrl;
  if (branding.logoEmoji !== undefined) business.logoEmoji = branding.logoEmoji;
  if (branding.accentColor !== undefined) business.accentColor = branding.accentColor;
  if (branding.address !== undefined) business.address = branding.address;

  db.saveToDisk();
  return business;
}
