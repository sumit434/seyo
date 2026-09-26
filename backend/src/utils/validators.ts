export function sanitizeMobile(raw: string): string {
  // Extract all digits; support international formats e.g. +1 555 123 4567 or 9876543210
  return raw.replace(/[^\d+]/g, '').trim();
}

export function isValidMobile(mobile: string): boolean {
  const sanitized = sanitizeMobile(mobile);
  // Must have at least 7 digits, maximum 15 digits
  const digitsOnly = sanitized.replace(/\+/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

export function sanitizeText(str: string): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 2000);
}
