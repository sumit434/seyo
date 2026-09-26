import { db, IDynamicQR } from '../config/db.js';
import { generateSecureKey } from '../utils/crypto.js';

export function createDynamicQR(
  businessId: string,
  type: 'spin' | 'loyalty' | 'combined' | 'spin-review' | 'loyalty-review' | 'review',
  ttlMinutes = 15
): IDynamicQR {
  const key = `sqr_${generateSecureKey(12)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000).toISOString();

  const qr: IDynamicQR = {
    id: `qr_${generateSecureKey(8)}`,
    key,
    businessId,
    type,
    isUsed: false,
    usedBy: null,
    createdAt: now.toISOString(),
    expiresAt,
  };

  db.qrCodes.set(key, qr);
  db.saveToDisk();
  return qr;
}

export function getQRByKey(key: string): IDynamicQR | null {
  const qr = db.qrCodes.get(key);
  if (!qr) return null;
  // Check if expired
  if (qr.expiresAt < new Date().toISOString()) {
    db.qrCodes.delete(key);
    db.saveToDisk();
    return null;
  }
  return qr;
}

export interface QRValidationResult {
  valid: boolean;
  statusCode?: number;
  error?: string;
  qr?: IDynamicQR;
}

export function validateAndLockQR(
  key: string,
  businessId: string,
  customerId: string
): QRValidationResult {
  const qr = db.qrCodes.get(key);
  if (!qr) {
    return {
      valid: false,
      statusCode: 404,
      error: 'Invalid or non-existent QR token.',
    };
  }

  // Cross-tenant verification
  if (qr.businessId !== businessId) {
    return {
      valid: false,
      statusCode: 403,
      error: 'QR token does not belong to this establishment.',
    };
  }

  // Expiration check
  if (qr.expiresAt < new Date().toISOString()) {
    db.qrCodes.delete(key);
    db.saveToDisk();
    return {
      valid: false,
      statusCode: 410,
      error: 'QR token has expired. Please ask staff for a fresh code.',
    };
  }

  // Lock check
  if (qr.isUsed) {
    if (qr.usedBy === customerId) {
      // Same customer resuming
      return { valid: true, qr };
    } else {
      // Conflict: different customer
      return {
        valid: false,
        statusCode: 409,
        error: 'VISIT_KEY_USED: This QR session was already activated by another guest.',
      };
    }
  }

  // Unused: lock atomically to this customer
  qr.isUsed = true;
  qr.usedBy = customerId;
  db.saveToDisk();

  return { valid: true, qr };
}
