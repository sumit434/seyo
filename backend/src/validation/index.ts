import { isValidMobile, sanitizeMobile } from '../utils/validators.js';

export function validateCustomerIdentify(body: any): { valid: boolean; error?: string; data?: { mobile: string; name?: string } } {
  if (!body || typeof body.mobile !== 'string') {
    return { valid: false, error: 'Mobile number is required' };
  }
  const cleanMobile = sanitizeMobile(body.mobile);
  if (!isValidMobile(cleanMobile)) {
    return { valid: false, error: 'Please enter a valid mobile number (min 7 digits)' };
  }
  return {
    valid: true,
    data: {
      mobile: cleanMobile,
      name: typeof body.name === 'string' ? body.name.trim().slice(0, 80) : undefined,
    },
  };
}

export function validateStaffPin(body: any): { valid: boolean; error?: string; data?: { pin: string; voucherCode?: string } } {
  if (!body || typeof body.pin !== 'string' || !body.pin.trim()) {
    return { valid: false, error: 'Staff 4-digit PIN is required' };
  }
  return {
    valid: true,
    data: {
      pin: body.pin.trim(),
      voucherCode: typeof body.voucherCode === 'string' ? body.voucherCode.trim() : undefined,
    },
  };
}

export function validateReviewSave(body: any): { valid: boolean; error?: string; data?: { reviewText: string; rating: number; tags: string[] } } {
  if (!body || typeof body.reviewText !== 'string' || !body.reviewText.trim()) {
    return { valid: false, error: 'Review text is required' };
  }
  const rating = Number(body.rating) || 5;
  const tags = Array.isArray(body.tags) ? body.tags.map((t: any) => String(t).slice(0, 50)) : [];
  return {
    valid: true,
    data: {
      reviewText: body.reviewText.trim().slice(0, 2000),
      rating: Math.max(1, Math.min(5, rating)),
      tags,
    },
  };
}

export function validateStaffLogin(body: any): { valid: boolean; error?: string; data?: { email: string; password: string } } {
  if (!body || !body.email || !body.password) {
    return { valid: false, error: 'Email and password are required' };
  }
  return {
    valid: true,
    data: {
      email: String(body.email).toLowerCase().trim(),
      password: String(body.password),
    },
  };
}
