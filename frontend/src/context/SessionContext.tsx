import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants/index.js';
import { determineNextStage, FlowDecisionOptions } from '../flow/flowController.js';
import { FlowStage } from '../flow/flowStages.js';
import { BusinessConfig, customerApi, CustomerStatus } from '../services/apiServices.js';

interface SessionData {
  business: BusinessConfig | null;
  customer: any | null;
  status: CustomerStatus | null;
  stage: FlowStage;
  qrKey: string | null;
  routeModule?: 'spin' | 'loyalty' | 'review' | 'combined' | 'v';
  isLoading: boolean;
  error: string | null;
  identify: (mobile: string, name?: string) => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  setStage: (stage: FlowStage) => void;
  clearError: () => void;
  logoutCustomer: () => void;
}

const SessionContext = createContext<SessionData | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
  slug: string;
  routeModule?: 'spin' | 'loyalty' | 'review' | 'combined' | 'v' | 'spin-review' | 'loyalty-review';
}

export const SessionProvider: React.FC<ProviderProps> = ({ children, slug, routeModule = 'combined' }) => {
  const [business, setBusiness] = useState<BusinessConfig | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [status, setStatus] = useState<CustomerStatus | null>(null);
  const [stage, setStage] = useState<FlowStage>('identify');
  const [qrKey, setQrKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Initial Load: Extract QR Key from URL, strip from browser URL, fetch business info & recover session
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setIsLoading(true);
      setError(null);

      // Check query param for key
      const params = new URLSearchParams(window.location.search);
      const keyFromUrl = params.get('key');
      let currentKey = keyFromUrl;

      if (keyFromUrl) {
        setQrKey(keyFromUrl);
        // Security requirement: Remove the sensitive QR key from visible URL
        try {
          params.delete('key');
          const newSearch = params.toString();
          const cleanUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch {
          // Ignore history API errors
        }
      }

      try {
        // Fetch authoritative business config
        const bizRes = await customerApi.getBusiness(slug);
        if (!isMounted) return;
        setBusiness(bizRes.business);

        // Check stored session for this specific business
        const rawSession = localStorage.getItem(`${STORAGE_KEYS.SESSION}_${slug}`);
        if (rawSession) {
          try {
            const parsed = JSON.parse(rawSession);
            if (parsed.customerId) {
              // Ask backend for authoritative customer status
              const statusRes = await customerApi.getStatus(slug, parsed.customerId);
              if (isMounted) {
                setCustomer(statusRes.customer);
                setStatus(statusRes.status);
                const next = determineNextStage(statusRes.status, { routeModule });
                setStage(next);
              }
            }
          } catch {
            localStorage.removeItem(`${STORAGE_KEYS.SESSION}_${slug}`);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Unable to connect to merchant. Please check the URL or try again.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [slug, routeModule]);

  // 2. Identify Customer
  const identify = useCallback(
    async (mobile: string, name?: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await customerApi.identify(slug, mobile, name, qrKey || undefined);
        setCustomer(res.customer);
        setStatus(res.status);
        setBusiness(res.business);

        // Save session for recovery
        localStorage.setItem(
          `${STORAGE_KEYS.SESSION}_${slug}`,
          JSON.stringify({
            customerId: res.customer.id,
            mobile: res.customer.mobile,
            businessId: res.business.id,
          })
        );

        // Compute first incomplete stage
        const next = determineNextStage(res.status, { routeModule });
        setStage(next);
        return true;
      } catch (err: any) {
        setError(err.message || 'Identification failed. Please try again.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [slug, qrKey, routeModule]
  );

  // 3. Refresh Status from Backend
  const refreshStatus = useCallback(async () => {
    if (!customer?.id) return;
    try {
      const res = await customerApi.getStatus(slug, customer.id);
      setStatus(res.status);
      setCustomer(res.customer);
      const next = determineNextStage(res.status, { routeModule });
      setStage(next);
    } catch {
      // Ignore background refresh errors
    }
  }, [slug, customer?.id, routeModule]);

  const clearError = useCallback(() => setError(null), []);

  const logoutCustomer = useCallback(() => {
    localStorage.removeItem(`${STORAGE_KEYS.SESSION}_${slug}`);
    setCustomer(null);
    setStatus(null);
    setStage('identify');
  }, [slug]);

  return (
    <SessionContext.Provider
      value={{
        business,
        customer,
        status,
        stage,
        qrKey,
        routeModule,
        isLoading,
        error,
        identify,
        refreshStatus,
        setStage,
        clearError,
        logoutCustomer,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
