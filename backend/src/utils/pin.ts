import crypto from 'crypto';

export function hashPin(pin: string): string {
  const salt = 'seyo_pin_salt_sec';
  return crypto.createHash('sha256').update(`${salt}:${pin.trim()}`).digest('hex');
}

export function verifyPin(inputPin: string, storedHash: string): boolean {
  if (!inputPin || !storedHash) return false;
  return hashPin(inputPin) === storedHash;
}
