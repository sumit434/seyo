import React, { useState } from 'react';
import { Button } from '../common/Button';
import { TopRankersModal } from './TopRankersModal';
import { Moon, RotateCcw, Trophy, CheckCircle2, Award, Flame, Check, Sparkles } from 'lucide-react';

interface CooldownScreenProps {
  businessName: string;
  businessSlug: string;
  logoEmoji: string;
  accentColor?: string;
  visitCount?: number;
  loyaltyTarget?: number;
  totalVisits?: number;
  loyaltyRewardTitle?: string;
  tier?: string;
  zomatoUrl?: string;
  swiggyUrl?: string;
  instagramUrl?: string;
  onRefresh: () => void;
}

export const CooldownScreen: React.FC<CooldownScreenProps> = ({
  businessName,
  businessSlug,
  logoEmoji,
  accentColor = '#0e7c66',
  visitCount = 0,
  loyaltyTarget = 6,
  totalVisits = 0,
  loyaltyRewardTitle,
  tier,
  zomatoUrl,
  swiggyUrl,
  instagramUrl,
  onRefresh,
}) => {
  const [isRankersOpen, setIsRankersOpen] = useState(false);

  // Loyalty metrics are enabled STRICTLY for 'combined' and 'loyalty' tiers, not for 'spin' tier
  const hasLoyalty = tier === 'loyalty' || tier === 'combined';
  const stampsRemaining = Math.max(0, loyaltyTarget - visitCount);

  // Social link helpers - ensure absolute URLs
  const formatUrl = (url?: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const formattedZomato = formatUrl(zomatoUrl);
  const formattedSwiggy = formatUrl(swiggyUrl);
  const formattedInsta = formatUrl(instagramUrl);
  const hasAnySocial = Boolean(formattedZomato || formattedSwiggy || formattedInsta);

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-3xl border border-[#e2e7e6] shadow-xl p-6 sm:p-8 text-center space-y-5">
      <div className="flex flex-col items-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-4 border border-[#e2e7e6]"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <span>{logoEmoji}</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e2f1ec] text-[#0e7c66] text-xs font-bold uppercase tracking-wider mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>All Stages Completed</span>
        </div>

        <h2 className="text-2xl font-black text-[#10181c] tracking-tight">Offer completed for today.</h2>

        <div className="mt-3 p-3.5 rounded-2xl bg-[#f1f3f2]/80 border border-[#e2e7e6] flex items-start gap-3 text-left w-full">
          <Moon className="w-4 h-4 text-[#0e7c66] shrink-0 mt-0.5" />
          <p className="text-xs text-[#10181c] leading-relaxed font-medium">
            Your offer will reset at midnight 00:00. Thank you for visiting us again!
          </p>
        </div>
      </div>

      {/* Loyalty Visit Stamps & Lifetime Visits Stats Box: STRICTLY for Combined & Loyalty tiers */}
      {/* Note: Visual stamp card dots and percentages removed as requested; only clean counts displayed */}
      {hasLoyalty && (
        <div className="bg-[#f8faf9] border border-[#e2e7e6] rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-[#e2e7e6] pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6a787e]">
              Your Loyalty Summary
            </span>
            <span className="text-xs font-bold text-[#0e7c66] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-[#0e7c66]" />
              <span>Active Member</span>
            </span>
          </div>

          {/* 2-Column Metric Tiles: Current Cycle Loyalty Count & Lifetime Visits */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Current Cycle Loyalty Stamps */}
            <div className="bg-white p-3 rounded-xl border border-[#e2e7e6] shadow-2xs">
              <div className="flex items-center justify-between text-[#6a787e] mb-1">
                <span className="text-[11px] font-semibold">Visit Stamps</span>
                <Award className="w-4 h-4 text-[#0e7c66]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#10181c] font-mono">{visitCount}</span>
                <span className="text-xs font-bold text-[#6a787e] font-mono">/ {loyaltyTarget}</span>
              </div>
              <p className="text-[10px] text-[#6a787e] mt-0.5 truncate">
                {stampsRemaining === 0
                  ? 'Milestone unlocked!'
                  : `${stampsRemaining} more to reward`}
              </p>
            </div>

            {/* Lifetime Total Visits */}
            <div className="bg-white p-3 rounded-xl border border-[#e2e7e6] shadow-2xs">
              <div className="flex items-center justify-between text-[#6a787e] mb-1">
                <span className="text-[11px] font-semibold">Lifetime Visits</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#10181c] font-mono">{totalVisits}</span>
                <span className="text-[11px] font-semibold text-[#6a787e]">visits</span>
              </div>
              <p className="text-[10px] text-[#6a787e] mt-0.5 truncate">
                At {businessName}
              </p>
            </div>
          </div>

          {loyaltyRewardTitle && (
            <p className="text-[11px] text-[#6a787e] text-center pt-0.5 truncate">
              Reward: <strong className="text-[#10181c]">{loyaltyRewardTitle}</strong>
            </p>
          )}
        </div>
      )}

      {/* Social Hyperlink Icons (Zomato, Swiggy, Instagram) - Shown above buttons only if configured */}
      {hasAnySocial && (
        <div className="bg-[#f8faf9] border border-[#e2e7e6] rounded-2xl p-3.5 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6a787e]">
            Connect With Us
          </p>
          <div className="flex items-center justify-center gap-3">
            {/* Zomato Icon Link */}
            {formattedZomato && (
              <a
                href={formattedZomato}
                target="_blank"
                rel="noopener noreferrer"
                title={`Visit ${businessName} on Zomato`}
                aria-label={`Visit ${businessName} on Zomato`}
                className="w-11 h-11 rounded-2xl bg-[#E23744] text-white flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all group"
              >
                <span className="font-black text-sm tracking-tighter italic lowercase font-serif group-hover:scale-110 transition-transform">
                  zomato
                </span>
              </a>
            )}

            {/* Swiggy Icon Link */}
            {formattedSwiggy && (
              <a
                href={formattedSwiggy}
                target="_blank"
                rel="noopener noreferrer"
                title={`Order from ${businessName} on Swiggy`}
                aria-label={`Order from ${businessName} on Swiggy`}
                className="w-11 h-11 rounded-2xl bg-[#FC8019] text-white flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all group"
              >
                {/* Clean Swiggy brand silhouette icon */}
                <svg
                  className="w-6 h-6 fill-current group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C7.58 2 4 5.58 4 10c0 3.2 1.88 5.96 4.6 7.24L12 22l3.4-4.76C18.12 15.96 20 13.2 20 10c0-4.42-3.58-8-8-8zm0 11.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 6.5 12 6.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
                </svg>
              </a>
            )}

            {/* Instagram Icon Link */}
            {formattedInsta && (
              <a
                href={formattedInsta}
                target="_blank"
                rel="noopener noreferrer"
                title={`Follow ${businessName} on Instagram`}
                aria-label={`Follow ${businessName} on Instagram`}
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all group"
              >
                <svg
                  className="w-5 h-5 stroke-current stroke-2 fill-none group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3 pt-1">
        <Button
          onClick={onRefresh}
          variant="primary"
          size="lg"
          fullWidth
          className="gap-2 shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Refresh Page</span>
        </Button>

        {hasLoyalty && (
          <Button
            onClick={() => setIsRankersOpen(true)}
            variant="outline"
            size="md"
            fullWidth
            className="gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Top Loyalty Rankers</span>
          </Button>
        )}
      </div>

      <TopRankersModal
        isOpen={isRankersOpen}
        onClose={() => setIsRankersOpen(false)}
        businessSlug={businessSlug}
      />
    </div>
  );
};

