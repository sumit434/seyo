import React, { useEffect, useState } from 'react';
import { staffApi } from '../services/staffApi';
import { CombinedTierTerminal } from '../components/staff/CombinedTierTerminal';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { safeSessionStorage } from '../utils/safeStorage';

export const StaffTerminalPage: React.FC = () => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [terminalData, setTerminalData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTerminalData = async (token: string) => {
    try {
      const res = await staffApi.getTerminalData(token);
      setTerminalData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff terminal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = safeSessionStorage.getItem('seyo_staff_session');
    if (!token) {
      window.location.href = '/staff/login';
      return;
    }
    setSessionToken(token);
    fetchTerminalData(token);
  }, []);

  const handleLogout = () => {
    safeSessionStorage.removeItem('seyo_staff_session');
    window.location.href = '/staff/login';
  };

  if (loading) {
    return <LoadingScreen message="Loading staff terminal..." />;
  }

  if (error || !terminalData) {
    return (
      <ErrorMessage
        title="Session Expired or Unauthorized"
        message={error || 'Please log in again with your staff credentials.'}
        actionText="Staff Login"
        onRetry={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f2] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <CombinedTierTerminal
          sessionToken={sessionToken!}
          business={terminalData.business}
          offer={terminalData.offer}
          entries={terminalData.entries || []}
          loyaltyRecords={terminalData.loyaltyRecords || []}
          rewards={terminalData.rewards || []}
          reviews={terminalData.reviews || []}
          offerHistory={terminalData.offerHistory || []}
          onRefresh={() => fetchTerminalData(sessionToken!)}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
};
