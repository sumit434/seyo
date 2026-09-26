import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SessionProvider, useSession } from '../context/SessionContext.js';
import { CustomerLayout } from '../layouts/CustomerLayout.js';
import { Loading } from '../components/common/Loading.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';
import { StageStepper } from '../components/customer/StageStepper.js';
import { MobileInput } from '../components/customer/MobileInput.js';
import { CooldownScreen } from '../components/customer/CooldownScreen.js';
import { ThankYouScreen } from '../components/customer/ThankYouScreen.js';
import { SpinWheel } from '../components/spin/SpinWheel.js';
import { RewardVoucher } from '../components/spin/RewardVoucher.js';
import { LoyaltyTracker } from '../components/loyalty/LoyaltyTracker.js';
import { ReviewBooster } from '../components/review/ReviewBooster.js';
import { spinApi, loyaltyApi } from '../services/apiServices.js';

interface EngagementViewProps {
  routeModule: 'spin' | 'loyalty' | 'review' | 'combined' | 'v' | 'spin-review' | 'loyalty-review';
}

const CustomerEngagementView: React.FC<EngagementViewProps> = ({ routeModule }) => {
  const {
    business,
    customer,
    status,
    stage,
    isLoading,
    error,
    identify,
    refreshStatus,
    setStage,
    clearError,
  } = useSession();

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading && !business) {
    return (
      <CustomerLayout business={null}>
        <Loading message="Connecting to merchant..." subtext="Validating engagement parameters" />
      </CustomerLayout>
    );
  }

  if (error && !business) {
    return (
      <CustomerLayout business={null}>
        <ErrorMessage
          title="Merchant Not Found"
          message={error}
          onRetry={refreshStatus}
        />
      </CustomerLayout>
    );
  }

  if (!business) return null;

  // Handler: Execute Spin
 const handleSpinExecution = async () => {
    if (!customer?.id || !business?.id) return null;
    setActionError(null);
    try {
      const res = await spinApi.execute(business.id, customer.id);
      // Removed refreshStatus() from here so the stage stays on 'spin' during the animation
      return {
        winningSlice: res.winningSlice,
        sliceIndex: res.sliceIndex,
      };
    } catch (err: any) {
      setActionError(err.message || 'Spin execution failed. Please try again.');
      return null;
    }
  };

  // Handler: Stamp Loyalty
  const handleLoyaltyStamp = async () => {
    if (!customer?.id || !business?.id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await loyaltyApi.stamp(business.id, customer.id);
      await refreshStatus();
      if (res.milestoneReached && res.reward) {
        setStage('voucher');
      } else {
        // In combined or loyalty-review mode: if review is available, offer review next
        if ((business.tier === 'combined' || business.tier === 'loyalty-review') && !status?.reviewJourneyCompleted) {
          setStage('review');
        } else {
          setStage('cooldown');
        }
      }
    } catch (err: any) {
      setActionError(err.message || 'Could not stamp visit. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Voucher Redeemed by Staff PIN
  const handleVoucherRedeemed = async () => {
    await refreshStatus();
  };

  // Handler: Continue after voucher claimed
  const handleContinueAfterVoucher = () => {
    // Determine next incomplete stage in Combined journey
    if (status?.loyaltyAvailable) {
      setStage('loyalty');
    } else if (status?.reviewAvailable) {
      setStage('review');
    } else if (status?.todaySpun || status?.todayVisited) {
      setStage('cooldown');
    } else {
      setStage('thank_you');
    }
  };

  return (
    <CustomerLayout business={business}>
      {/* Visual stage stepper for combined tier */}
      <StageStepper
        currentStage={stage}
        tier={business.tier}
        status={status}
      />

      {actionError && (
        <div className="mb-4">
          <ErrorMessage
            message={actionError}
            onDismiss={() => setActionError(null)}
          />
        </div>
      )}

      {/* 1. Identification Stage */}
      {stage === 'identify' && (
        <MobileInput
          onSubmit={identify}
          isLoading={isLoading}
          error={error}
          businessName={business.name}
        />
      )}

      {/* 2. Active Voucher Waiting for Staff PIN */}
      {stage === 'voucher' && status?.activeVoucher && (
        <RewardVoucher
          voucher={status.activeVoucher}
          businessId={business.id}
          customerId={customer.id}
          businessName={business.name}
          onRedeemed={handleVoucherRedeemed}
          onContinue={handleContinueAfterVoucher}
        />
      )}

      {/* 3. Spin & Win Stage */}
      {/* 3. Spin & Win Stage */}
      {stage === 'spin' && (
        <SpinWheel
          slices={business.spinWheelConfiguration || []}
          onSpin={handleSpinExecution}
          onComplete={async () => {
            await refreshStatus(); // Refresh status now that the spin animation is fully done
            setStage('voucher');
          }}
        />
      )}
      
      {/* 4. Digital Loyalty Stage */}
      {stage === 'loyalty' && status && (
        <LoyaltyTracker
          visitCount={status.visitCount}
          totalVisits={status.totalVisits}
          target={status.loyaltyTarget}
          rewardDescription={status.loyaltyReward}
          businessName={business.name}
          isStampedToday={status.todayVisited}
          onStamp={handleLoyaltyStamp}
          isLoading={actionLoading}
          milestoneReached={status.visitCount >= status.loyaltyTarget}
        />
      )}

      {/* 5. AI Google Review Booster Stage */}
      {stage === 'review' && customer && (
        <ReviewBooster
          businessId={business.id}
          customerId={customer.id}
          businessName={business.name}
          onSuccess={async () => {
            await refreshStatus();
            setStage('thank_you');
          }}
        />
      )}

      {/* 6. Midnight Cooldown Stage */}
      {stage === 'cooldown' && status && (
        <CooldownScreen
          businessName={business.name}
          status={status}
          onRefresh={refreshStatus}
          onContinueReview={
            status.reviewAvailable ? () => setStage('review') : undefined
          }
        />
      )}

      {/* 7. Thank You / Completed Stage */}
      {stage === 'thank_you' && status && (
        <ThankYouScreen
          businessName={business.name}
          status={status}
          onRefresh={refreshStatus}
        />
      )}
    </CustomerLayout>
  );
};

export const CustomerEngagementPage: React.FC<{
  routeModule?: 'spin' | 'loyalty' | 'review' | 'combined' | 'v' | 'spin-review' | 'loyalty-review';
}> = ({ routeModule = 'combined' }) => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return (
      <CustomerLayout business={null}>
        <ErrorMessage
          title="Invalid URL"
          message="No business slug provided in the URL."
        />
      </CustomerLayout>
    );
  }

  return (
    <SessionProvider slug={slug} routeModule={routeModule}>
      <CustomerEngagementView routeModule={routeModule} />
    </SessionProvider>
  );
};
