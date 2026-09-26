import crypto from 'crypto';

export function generateSecureKey(bytes = 16): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateVoucherCode(prefix = 'REW'): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const char = chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${char}${num}`;
}
