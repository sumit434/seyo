import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../constants/index.js';
import { staffApi } from '../services/apiServices.js';

interface StaffAuthData {
  token: string | null;
  business: any | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  setSession: (token: string, business: any) => void;
  logout: () => void;
  clearError: () => void;
}

const StaffAuthContext = createContext<StaffAuthData | undefined>(undefined);

export const StaffAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.STAFF_TOKEN));
  const [business, setBusiness] = useState<any | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF_BUSINESS);
    return raw ? JSON.parse(raw) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.STAFF_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.STAFF_TOKEN);
    }
  }, [token]);

  useEffect(() => {
    if (business) {
      localStorage.setItem(STORAGE_KEYS.STAFF_BUSINESS, JSON.stringify(business));
    } else {
      localStorage.removeItem(STORAGE_KEYS.STAFF_BUSINESS);
    }
  }, [business]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await staffApi.login(email, password);
      setToken(res.token);
      setBusiness(res.business);
      return true;
    } catch (err: any) {
      setError(err.message || 'Staff authentication failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setSession = useCallback((newToken: string, newBusiness: any) => {
    setToken(newToken);
    setBusiness(newBusiness);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setBusiness(null);
    localStorage.removeItem(STORAGE_KEYS.STAFF_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.STAFF_BUSINESS);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <StaffAuthContext.Provider
      value={{
        token,
        business,
        isLoading,
        error,
        login,
        setSession,
        logout,
        clearError,
      }}
    >
      {children}
    </StaffAuthContext.Provider>
  );
};

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return ctx;
}
