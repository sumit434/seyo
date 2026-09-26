import crypto from 'crypto';

export function hashPassword(password: string): string {
  const salt = 'seyo_salt_auth_2026';
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
