import React, { useState } from 'react';
import { ProductTier, PRODUCT_TIERS } from '../../../shared/constants/tiers';
import { OnboardingDraftData } from '../../../shared/types/onboarding';
import { Button } from '../common/Button';
import { ArrowLeft, Rocket, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ConfirmationStepProps {
  tier: ProductTier;
  draftData: OnboardingDraftData;
  onLaunch: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  tier,
  draftData,
  onLaunch,
  onBack,
  isLoading,
}) => {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const tierInfo = PRODUCT_TIERS[tier] || PRODUCT_TIERS.combined;

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-bold text-[#10181c]">Ready to Launch Your SEYO Platform</h2>
        <p className="text-sm text-[#6a787e] mt-1">
          Review your configuration summary before activating the live customer campaign.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-3xl border border-[#e2e7e6] p-6 space-y-5 divide-y divide-[#e2e7e6]">
        {/* Business Header */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border border-[#e2e7e6] overflow-hidden"
            style={{ backgroundColor: `${draftData.accentColor || '#0e7c66'}15` }}
          >
            {draftData.logoUrl ? (
              <img src={draftData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span>{draftData.logoEmoji || '🏪'}</span>
            )}
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0e7c66] text-white">
              {tierInfo.name} Tier
            </span>
            <h3 className="text-xl font-bold text-[#10181c] mt-1">{draftData.businessName}</h3>
            <p className="text-xs text-[#6a787e]">
              {draftData.category} • {draftData.city}, {draftData.country} ({draftData.timezone})
            </p>
          </div>
        </div>

        {/* Tier Details */}
        <div className="pt-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#6a787e]">Configured Features</h4>

          {tierInfo.hasSpin && draftData.spinWheelConfiguration && (
            <div className="p-3.5 rounded-2xl bg-[#f1f3f2]/60 border border-[#e2e7e6]">
              <div className="flex items-center justify-between text-sm font-bold text-[#10181c] mb-2">
                <span>🎡 Spin & Win Wheel</span>
                <span className="text-xs text-[#0e7c66] font-semibold">
                  {draftData.spinWheelConfiguration.length} Slices (100% Guaranteed Win)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#6a787e]">
                {draftData.spinWheelConfiguration.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 truncate">
                    <span>{s.emoji}</span>
                    <span className="truncate">{s.rewardLabel} ({s.weight}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tierInfo.hasLoyalty && (
            <div className="p-3.5 rounded-2xl bg-[#f1f3f2]/60 border border-[#e2e7e6]">
              <div className="flex items-center justify-between text-sm font-bold text-[#10181c] mb-1">
                <span>⭐ Digital Stamp Card</span>
                <span className="text-xs text-[#0e7c66] font-semibold">
                  {draftData.loyaltyTarget} Visits • {draftData.loyaltyValidationDays} Days Window
                </span>
              </div>
              <p className="text-xs text-[#6a787e]">
                Milestone Reward: <span className="font-semibold text-[#10181c]">{draftData.loyaltyReward}</span>
              </p>
            </div>
          )}

          {(tierInfo.hasReview || draftData.googleReviewUrl) && (
            <div className="p-3.5 rounded-2xl bg-[#f1f3f2]/60 border border-[#e2e7e6]">
              <div className="flex items-center justify-between text-sm font-bold text-[#10181c] mb-1">
                <span>⭐ Google Review Accelerator</span>
                <span className="text-xs text-[#0e7c66] font-semibold">
                  {tierInfo.hasReview ? 'Verified Feedback' : 'Add-On Enabled'}
                </span>
              </div>
              <p className="text-xs text-[#6a787e] truncate">
                Target URL: <span className="text-[#10181c] font-medium">{draftData.googleReviewUrl || 'Not configured'}</span>
              </p>
            </div>
          )}

          {/* Social Links Summary if configured */}
          {(draftData.zomatoUrl || draftData.swiggyUrl || draftData.instagramUrl) && (
            <div className="p-3.5 rounded-2xl bg-[#f1f3f2]/60 border border-[#e2e7e6]">
              <div className="flex items-center justify-between text-sm font-bold text-[#10181c] mb-1">
                <span>🔗 Connected Social Channels</span>
                <span className="text-xs text-[#0e7c66] font-semibold">Cooldown Page</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs pt-1">
                {draftData.zomatoUrl && (
                  <span className="px-2 py-0.5 rounded-md bg-[#E23744]/10 text-[#E23744] font-semibold">
                    Zomato Active
                  </span>
                )}
                {draftData.swiggyUrl && (
                  <span className="px-2 py-0.5 rounded-md bg-[#FC8019]/10 text-[#FC8019] font-semibold">
                    Swiggy Active
                  </span>
                )}
                {draftData.instagramUrl && (
                  <span className="px-2 py-0.5 rounded-md bg-pink-100 text-pink-700 font-semibold">
                    Instagram Active
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Security Summary */}
        <div className="pt-4 flex items-center justify-between text-xs text-[#6a787e]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0e7c66]" />
            Staff Security Configured
          </span>
          <span className="font-mono bg-white border border-[#e2e7e6] px-2 py-1 rounded-md text-[#10181c] font-bold">
            PIN: ••••
          </span>
        </div>
      </div>

      {/* Mandatory Immutability Acknowledgment Checkbox */}
      <div className="bg-amber-50/80 border border-amber-200/80 p-5 rounded-2xl text-left">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAcknowledged}
            onChange={e => setIsAcknowledged(e.target.checked)}
            className="mt-1 w-5 h-5 rounded-md border-amber-400 text-[#0e7c66] focus:ring-[#0e7c66] cursor-pointer"
          />
          <div className="text-xs text-amber-900 leading-relaxed font-medium">
            <div className="font-bold flex items-center gap-1.5 text-amber-950 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Offer Immutability Rule</span>
            </div>
            I understand that once this offer is launched, its active configuration cannot be edited midway. It must be completed, cancelled, or deleted before a new configuration can be created.
          </div>
        </label>
      </div>

      <div className="pt-2 flex items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={!isAcknowledged}
          isLoading={isLoading}
          onClick={onLaunch}
          className="gap-2 shadow-lg"
        >
          <Rocket className="w-5 h-5" />
          <span>Launch Live Platform</span>
        </Button>
      </div>
    </div>
  );
};
