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
