import { request } from './api';

export const staffApi = {
  // Staff login
  async login(identifier: string, password: string) {
    return request('/api/staff/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  // Terminal data
  async getTerminalData(sessionToken: string) {
    return request('/api/staff/terminal-data', {
      headers: {
        'x-staff-session': sessionToken,
      },
    });
  },

  // Redeem voucher using 4-digit PIN
  async redeemVoucher(sessionToken: string, voucherCode: string, staffPin: string) {
    return request('/api/staff/redeem-voucher', {
      method: 'POST',
      headers: {
        'x-staff-session': sessionToken,
      },
      body: JSON.stringify({ voucherCode, staffPin }),
    });
  },

  // Delete / cancel active offer
  async deleteOffer(sessionToken: string) {
    return request('/api/staff/delete-offer', {
      method: 'POST',
      headers: {
        'x-staff-session': sessionToken,
      },
    });
  },

  // Cancel offer (alias)
  async cancelOffer(sessionToken: string) {
    return request('/api/staff/delete-offer', {
      method: 'POST',
      headers: {
        'x-staff-session': sessionToken,
      },
    });
  },

  // Get historical offers for business
  async getOfferHistory(sessionToken: string) {
    return request<{ success: boolean; offers: any[] }>('/api/staff/offer-history', {
      headers: {
        'x-staff-session': sessionToken,
      },
    });
  },

  // Activate new campaign/offer matching tier plan
  async activateOffer(sessionToken: string, offerData: any) {
    return request<{ success: boolean; message: string; offer: any }>('/api/staff/activate-offer', {
      method: 'POST',
      headers: {
        'x-staff-session': sessionToken,
      },
      body: JSON.stringify(offerData),
    });
  },

  // Standalone QR code generation
  async getQrCode(url: string) {
    return request<{ success: boolean; qrDataUrl: string }>(`/api/staff/qr-code?url=${encodeURIComponent(url)}`);
  },

  // Refresh Dynamic Counter QR session key
  async refreshQr(sessionToken: string, entryId?: string) {
    return request<{
      success: boolean;
      sessionKey: string;
      customerUrl: string;
      qrDataUrl: string;
      expiresAt: string;
    }>('/api/staff/qr/refresh', {
      method: 'POST',
      headers: {
        'x-staff-session': sessionToken,
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ entryId }),
    });
  },

  // Update Merchant Profile and Branding
  async updateProfile(
    sessionToken: string,
    profileData: {
      name?: string;
      logoEmoji?: string;
      logoUrl?: string;
      googleReviewUrl?: string;
      instagramUrl?: string;
      websiteUrl?: string;
      facebookUrl?: string;
      zomatoUrl?: string;
      swiggyUrl?: string;
      accentColor?: string;
    }
  ) {
    return request<{
      success: boolean;
      message: string;
      business: any;
    }>('/api/staff/profile', {
      method: 'PUT',
      headers: {
        'x-staff-session': sessionToken,
      },
      body: JSON.stringify(profileData),
    });
  },
};
