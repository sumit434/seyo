import { db, ICustomer } from '../config/db.js';
import { generateSecureKey } from '../utils/crypto.js';

export function getCustomerCompoundKey(businessId: string, mobile: string): string {
  return `${businessId}:${mobile.trim()}`;
}

export function getOrCreateCustomer(
  businessId: string,
  mobile: string,
  name?: string
): ICustomer {
  const compoundKey = getCustomerCompoundKey(businessId, mobile);
  let customer = db.customers.get(compoundKey);

  if (!customer) {
    customer = {
      id: `cust_${generateSecureKey(8)}`,
      businessId,
      mobile: mobile.trim(),
      name: name?.trim() || 'Loyal Guest',
      visitCount: 0,
      totalVisits: 0,
      lastVisitAt: null,
      totalRewardsClaimed: 0,
      lastSpinAt: null,
      totalSpins: 0,
      activeVoucher: null,
      reviewJourneyCompleted: false,
      reviewJourneyCompletedAt: null,
      createdAt: new Date().toISOString(),
    };
    db.customers.set(compoundKey, customer);
    db.saveToDisk();
  } else if (name && name.trim() && customer.name === 'Loyal Guest') {
    customer.name = name.trim();
    db.saveToDisk();
  }

  return customer;
}

export function getCustomerById(businessId: string, customerId: string): ICustomer | null {
  for (const c of db.customers.values()) {
    if (c.businessId === businessId && c.id === customerId) {
      return c;
    }
  }
  return null;
}
