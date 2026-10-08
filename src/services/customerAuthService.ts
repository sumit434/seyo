import { request } from './api';
import { CustomerStatusResponse } from '../../shared/types/qr';

export const customerAuthService = {
  // Direct customer entry without OTP
  async identify(
    businessId: string,
    mobile: string,
    name?: string,
    countryCode: string = '+1',
    sessionKey?: string
  ): Promise<{
    success: boolean;
    sessionToken: string;
    sessionKey?: string;
    isNew: boolean;
  } & CustomerStatusResponse> {
    return request('/api/auth/customer/identify', {
      method: 'POST',
      body: JSON.stringify({ businessId, mobile, name, countryCode, sessionKey }),
    });
  },

  // Request OTP for customer login (legacy fallback)
  async requestOtp(businessId: string, mobile: string, countryCode: string = '+1', sessionKey?: string) {
    return request<{
      success: boolean;
      maskedMobile: string;
      demoOtp: string;
      isExistingCustomer: boolean;
    }>('/api/auth/customer/otp/request', {
      method: 'POST',
      body: JSON.stringify({ businessId, mobile, countryCode, sessionKey }),
    });
  },

  // Verify OTP
  async verifyOtp(
    businessId: string,
    mobile: string,
    otp: string,
    name?: string,
    countryCode: string = '+1',
    sessionKey?: string
  ): Promise<{
    success: boolean;
    sessionToken: string;
    sessionKey?: string;
    isNew: boolean;
  } & CustomerStatusResponse> {
    return request('/api/auth/customer/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ businessId, mobile, otp, name, countryCode, sessionKey }),
    });
  },
};
