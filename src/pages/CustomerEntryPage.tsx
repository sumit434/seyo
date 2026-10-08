import React, { useEffect, useState } from 'react';
import { customerService } from '../services/customerService';
import { CustomerStatusResponse } from '../../shared/types/qr';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { NoOfferScreen } from '../components/customer/NoOfferScreen';
import { CustomerAuthFlow } from '../components/customer/CustomerAuthFlow';
import { SpinWheel } from '../components/customer/SpinWheel';
import { RewardVoucher } from '../components/customer/RewardVoucher';
import { LoyaltyTracker } from '../components/customer/LoyaltyTracker';
import { ReviewGenerator } from '../components/review/ReviewGenerator';
import { CooldownScreen } from '../components/customer/CooldownScreen';
import { safeSessionStorage } from '../utils/safeStorage';

interface CustomerEntryPageProps {
  slug: string;
  entryMode?: 'combined' | 'spin' | 'loyalty' | 'review';
  initialSessionKey?: string;
}

export const CustomerEntryPage: React.FC<CustomerEntryPageProps> = ({ slug, entryMode = 'combined', initialSessionKey }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<CustomerStatusResponse | null>(null);
  const [isActiveOffer, setIsActiveOffer] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const getUrlSessionKey = () => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('sk') || params.get('key') || params.get('token') || params.get('sessionKey') || null;
  };

  const [sessionKey, setSessionKey] = useState<string | null>(() => {
    return initialSessionKey || getUrlSessionKey();
  });

  const loadCustomerJourney = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeKey = sessionKey || initialSessionKey || getUrlSessionKey();

      // Only read stored session if there is an active sessionKey for this visit
      // Clean URLs must remain strictly view-only and never resume an old claim session
      const storedToken = activeKey ? safeSessionStorage.getItem(`seyo_customer_session_${slug}`) : null;
      const storedCustomerId = activeKey ? safeSessionStorage.getItem(`seyo_customer_id_${slug}`) : null;

      // 1. Resolve merchant entry with unique session key
      const resolveRes = await customerService.resolveEntry(
        slug,
        entryMode === 'loyalty' ? 'nfc' : 'qr',
        activeKey || undefined,
        entryMode
      );

      if (resolveRes.sessionKey) {
        setSessionKey(resolveRes.sessionKey);
      } else if (!activeKey) {
        setSessionKey(null);
        setSessionToken(null);
      }

      if (!resolveRes.isActive) {
        setIsActiveOffer(false);
        setStatusData({
          business: resolveRes.business as any,
          offer: null,
          customer: null,
          status: {
            spinAvailable: false,
            spinCompletedToday: false,
            loyaltyAvailable: false,
            loyaltyCompletedToday: false,
            loyaltyMilestoneReached: false,
            activeReward: null,
            reviewJourneyCompleted: false,
            currentStage: 'auth',
            isCooldown: false,
          },
        });
        setLoading(false);
        return;
      }

      setIsActiveOffer(true);

      // Clean merchant URL without ?sk= -> View-Only Mode
      if (!activeKey || (resolveRes as any).isViewOnly) {
        setSessionToken(null);
        setStatusData({
          business: resolveRes.business as any,
          offer: resolveRes.offer as any,
          customer: null,
          status: {
            ...((resolveRes.status as any) || {}),
            claimAvailable: false,
            isViewOnly: true,
            currentStage: 'auth',
          },
        });
        setLoading(false);
        return;
      }

      const token = storedToken || resolveRes.sessionToken || null;
      if (token) {
        setSessionToken(token);
        safeSessionStorage.setItem(`seyo_customer_session_${slug}`, token);
      }

      // 2. Fetch customer status if authenticated
      if (token && storedCustomerId) {
        const fullStatus = await customerService.getStatus(slug, token, storedCustomerId, entryMode);
        setStatusData(fullStatus);
      } else {
        setStatusData({
          business: resolveRes.business as any,
          offer: resolveRes.offer as any,
          customer: null,
          status: resolveRes.status as any,
        });
      }
    } catch (err: any) {
      const is403 =
        err.status === 403 ||
        err.code === 'SESSION_ALREADY_USED' ||
        err.data?.error === 'SESSION_ALREADY_USED' ||
        err.message?.toLowerCase().includes('already used') ||
        err.message?.toLowerCase().includes('expired') ||
        err.message?.includes('403');

      if (is403) {
        setError('Token already used or expired');
      } else {
        setError(err.message || 'Could not load rewards experience.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerJourney();
  }, [slug]);

  // When user returns to tab after completing Google Review form or backgrounding browser
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const storedToken = safeSessionStorage.getItem(`seyo_customer_session_${slug}`);
        const storedCustomerId = safeSessionStorage.getItem(`seyo_customer_id_${slug}`);
        if (storedToken && storedCustomerId) {
          try {
            const updated = await customerService.getStatus(slug, storedToken, storedCustomerId);
            setStatusData(updated);
          } catch {
            // silent fail on visibility refresh
          }
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [slug]);

  if (loading) {
    return <LoadingScreen message="Connecting to rewards station..." />;
  }

  if (error) {
    const isSession403 =
      error === 'Token already used or expired' ||
      error.toLowerCase().includes('already used') ||
      error.toLowerCase().includes('expired') ||
      error.includes('403');

    return (
      <ErrorMessage
        title={isSession403 ? "Token already used or expired" : "Unable to Connect"}
        message={isSession403 ? "Token already used or expired" : error}
        onRetry={isSession403 ? undefined : loadCustomerJourney}
      />
    );
  }

  if (!statusData || !statusData.business) {
    return (
      <ErrorMessage
        title="Business Not Found"
        message="The merchant QR or NFC identifier could not be verified."
      />
    );
  }

  // Fallback screen if offer is inactive
  if (!isActiveOffer || !statusData.offer) {
    return (
      <div className="min-h-screen bg-[#f1f3f2] flex flex-col items-center justify-center p-4">
        <NoOfferScreen
          businessName={statusData.business.name}
          logoEmoji={statusData.business.logoEmoji}
          accentColor={statusData.business.accentColor}
        />
      </div>
    );
  }

  const { business, offer, customer, status } = statusData;

  const isViewOnly = !sessionKey || (statusData as any)?.isViewOnly || (statusData?.status as any)?.isViewOnly;

  // If customer is not authenticated yet -> show CustomerAuthFlow
  if (!customer) {
    return (
      <div className="min-h-screen bg-[#f1f3f2] flex flex-col items-center justify-center p-4">
        <CustomerAuthFlow
          businessId={business.id}
          businessName={business.name}
          logoEmoji={business.logoEmoji}
          accentColor={business.accentColor}
          sessionKey={sessionKey || undefined}
          isViewOnly={Boolean(isViewOnly)}
          onAuthenticated={payload => {
            safeSessionStorage.setItem(`seyo_customer_session_${slug}`, payload.sessionToken);
            if (payload.sessionKey) {
              setSessionKey(payload.sessionKey);
            }
            if (payload.customer) {
              safeSessionStorage.setItem(`seyo_customer_id_${slug}`, payload.customer.id);
            }
            setStatusData(payload);
          }}
        />
      </div>
    );
  }

  // Customer is authenticated: Render the FIRST INCOMPLETE STAGE
  return (
    <div className="min-h-screen bg-[#f1f3f2] flex flex-col items-center justify-between py-6 px-4">
      {/* Customer Header Branding */}
      <div className="w-full max-w-sm flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs border border-[#e2e7e6]"
            style={{ backgroundColor: `${business.accentColor}15` }}
          >
            <span>{business.logoEmoji}</span>
          </div>
          <div className="text-left">
            <h1 className="font-bold text-sm text-[#10181c] leading-tight">{business.name}</h1>
            <p className="text-[11px] text-[#6a787e]">
              Hello, <strong className="text-[#0e7c66]">{customer.name}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* STAGE 1: ACTIVE VOUCHER (Needs staff PIN redemption) */}
      {status.currentStage === 'voucher' && status.activeReward && (
        <RewardVoucher
          voucher={{
            rewardId: status.activeReward.rewardId,
            code: status.activeReward.code,
            title: status.activeReward.title,
            type: status.activeReward.type,
            claimedAt: new Date().toISOString(),
          }}
          businessName={business.name}
          businessId={business.id}
          customerId={customer.id}
          onRedeemed={async () => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id, entryMode);
            setStatusData(updated);
          }}
          onContinue={async () => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id, entryMode);
            setStatusData(updated);
          }}
        />
      )}

      {/* STAGE 2: SPIN WHEEL (If tier has spin and not spun today) */}
      {status.currentStage === 'spin' && offer.spinWheelConfiguration && (
        <SpinWheel
          businessId={business.id}
          customerId={customer.id}
          sessionToken={sessionToken || undefined}
          slices={offer.spinWheelConfiguration}
          accentColor={business.accentColor}
          onSpinCompleted={async reward => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id, entryMode);
            setStatusData(updated);
          }}
        />
      )}

      {/* STAGE 3: LOYALTY REWARD (Milestone unlocked, waiting for voucher redemption) */}
      {status.currentStage === 'loyalty_reward' && customer.activeVoucher && (
        <RewardVoucher
          voucher={{
            rewardId: customer.activeVoucher.rewardId,
            code: customer.activeVoucher.code,
            title: customer.activeVoucher.title,
            type: 'loyalty',
            claimedAt: customer.activeVoucher.claimedAt,
          }}
          businessName={business.name}
          businessId={business.id}
          customerId={customer.id}
          onRedeemed={async () => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id, entryMode);
            setStatusData(updated);
          }}
          onContinue={async () => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id, entryMode);
            setStatusData(updated);
          }}
        />
      )}

      {/* STAGE 4: LOYALTY TRACKER (If tier has loyalty and not stamped today) */}
      {status.currentStage === 'loyalty' && (
        <LoyaltyTracker
          businessId={business.id}
          customerId={customer.id}
          sessionToken={sessionToken || undefined}
          visitCount={customer.visitCount}
          loyaltyTarget={offer.loyaltyTarget || 6}
          totalVisits={customer.totalVisits}
          loyaltyRewardTitle={offer.loyaltyReward || 'Special Gift'}
          isStampedToday={status.loyaltyCompletedToday}
          onStampSuccess={async () => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id, entryMode);
            setStatusData(updated);
          }}
          onContinue={async () => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id, entryMode);
            setStatusData(updated);
          }}
        />
      )}

      {/* STAGE 5: REVIEW GENERATOR (Review accelerator tier or add-on for first-time review entry) */}
      {status.currentStage === 'review' && (
        <ReviewGenerator
          businessId={business.id}
          businessName={business.name}
          customerId={customer.id}
          customerName={customer.name}
          googleReviewUrl={offer.googleReviewUrl || business.googleReviewUrl || `https://maps.google.com/?q=${encodeURIComponent(business.name)}`}
          onReviewCompleted={async () => {
            const updated = await customerService.getStatus(slug, sessionToken || undefined, customer.id, entryMode);
            setStatusData(updated);
          }}
        />
      )}

      {/* STAGE 6: COOLDOWN (All daily activities completed!) */}
      {status.currentStage === 'cooldown' && (
        <CooldownScreen
          businessName={business.name}
          businessSlug={business.slug}
          logoEmoji={business.logoEmoji}
          accentColor={business.accentColor}
          visitCount={customer.visitCount}
          loyaltyTarget={offer.loyaltyTarget || 6}
          totalVisits={customer.totalVisits}
          loyaltyRewardTitle={offer.loyaltyReward}
          tier={business.tier}
          zomatoUrl={business.zomatoUrl}
          swiggyUrl={business.swiggyUrl}
          instagramUrl={business.instagramUrl}
          onRefresh={loadCustomerJourney}
        />
      )}

      {/* Minimal Footer */}
      <footer className="mt-8 text-center">
        <p className="text-[11px] text-[#6a787e] uppercase tracking-wider font-semibold">
          Powered by SEYO Platform
        </p>
      </footer>
    </div>
  );
};
