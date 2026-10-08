import { useState, useCallback } from 'react';
import { customerAuthService } from '../services/customerAuthService';
import { CustomerStatusResponse } from '../../shared/types/qr';

export type AuthMode = 'auth0_passwordless' | 'seyo_direct';

export interface UseAuthModeReturn {
  authMode: AuthMode;
  isAuth0Bypassed: boolean;
  isLoading: boolean;
  error: string | null;
  sendOtp: (businessId: string, mobile: string, countryCode?: string) => Promise<{
    maskedMobile: string;
    demoOtp: string;
    isExistingCustomer: boolean;
  }>;
  verifyOtp: (
    businessId: string,
    mobile: string,
    otp: string,
    name?: string,
    countryCode?: string
  ) => Promise<{
    sessionToken: string;
    isNew: boolean;
    auth0Token?: string;
  } & CustomerStatusResponse>;
  quickMockLogin: (
    businessId: string,
    name?: string
  ) => Promise<{
    sessionToken: string;
    isNew: boolean;
  } & CustomerStatusResponse>;
}

/**
 * Auth0 Abstraction Layer Hook (useAuthMode)
 * Allows the authentication provider to switch between live Auth0 passwordless
 * and SEYO direct inline verification seamlessly, with automatic soft-bypass
 * for smooth local development.
 */
export function useAuthMode(): UseAuthModeReturn {
  const [authMode] = useState<AuthMode>('auth0_passwordless');
  // In development, Auth0 validation is soft-disabled/bypassed
  const [isAuth0Bypassed] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(
    async (businessId: string, mobile: string, countryCode: string = '+1') => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await customerAuthService.requestOtp(businessId, mobile, countryCode);
        return {
          maskedMobile: res.maskedMobile,
          demoOtp: res.demoOtp,
          isExistingCustomer: res.isExistingCustomer,
        };
      } catch (err: any) {
        const msg = err.message || 'Failed to send verification code';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const verifyOtp = useCallback(
    async (
      businessId: string,
      mobile: string,
      otp: string,
      name?: string,
      countryCode: string = '+1'
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await customerAuthService.verifyOtp(businessId, mobile, otp, name, countryCode);
        return res;
      } catch (err: any) {
        const msg = err.message || 'Verification failed';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const quickMockLogin = useCallback(
    async (businessId: string, name: string = 'Dev Customer') => {
      return verifyOtp(businessId, '+15551234567', '123456', name, '+1');
    },
    [verifyOtp]
  );

  return {
    authMode,
    isAuth0Bypassed,
    isLoading,
    error,
    sendOtp,
    verifyOtp,
    quickMockLogin,
  };
}
