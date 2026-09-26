import React from 'react';
import { Award, Check, Sparkles, Trophy, CalendarCheck } from 'lucide-react';
import { Button } from '../common/Button.js';

interface LoyaltyTrackerProps {
  visitCount: number;
  totalVisits: number;
  target: number;
  rewardDescription: string;
  businessName: string;
  isStampedToday: boolean;
  onStamp: () => Promise<void>;
  isLoading: boolean;
  milestoneReached: boolean;
}

export const LoyaltyTracker: React.FC<LoyaltyTrackerProps> = ({
  visitCount,
  totalVisits,
  target,
  rewardDescription,
  businessName,
  isStampedToday,
  onStamp,
  isLoading,
  milestoneReached,
}) => {
  const slots = Array.from({ length: target }, (_, i) => i + 1);

  return (
    <div className="w-full flex flex-col items-center animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft text-brand-dark text-xs font-bold uppercase tracking-wider mb-1.5">
          <Award className="w-3.5 h-3.5" />
          <span>Digital Stamp Card</span>
        </div>
        <h2 className="text-xl font-black text-ink">Your Loyalty Rewards</h2>
        <p className="text-xs text-muted">
          Collect {target} stamps to unlock your reward at {businessName}.
        </p>
      </div>

      {/* Digital Stamp Pass Card */}
      <div className="w-full rounded-3xl border border-line bg-white p-5 shadow-sm my-2">
        {/* Pass Top Ribbon */}
        <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
          <div>
            <span className="text-xs text-muted block">Loyalty Progress</span>
            <span className="text-base font-extrabold text-ink">
              {visitCount} of {target} Stamps
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted block">Lifetime Visits</span>
            <span className="text-sm font-bold text-brand">{totalVisits} Total</span>
          </div>
        </div>

        {/* Stamps Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {slots.map(slotNum => {
            const isFilled = slotNum <= visitCount;
            const isMilestone = slotNum === target;

            return (
              <div
                key={slotNum}
                className={`relative h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-300 ${
                  isFilled
                    ? 'border-brand bg-brand-soft/80 text-brand shadow-xs'
                    : isMilestone
                    ? 'border-dashed border-amber-300 bg-amber-50/50 text-amber-600'
                    : 'border-dashed border-line bg-surface-soft/60 text-muted'
                }`}
              >
                {isFilled ? (
                  <div className="flex flex-col items-center scale-100 transition-transform">
                    <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shadow-xs mb-1">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <span className="text-[10px] font-bold text-brand-dark">Visit #{slotNum}</span>
                  </div>
                ) : isMilestone ? (
                  <div className="flex flex-col items-center">
                    <Trophy className="w-6 h-6 text-amber-500 mb-1" />
                    <span className="text-[10px] font-bold text-amber-800">REWARD</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-60">
                    <span className="text-lg font-bold text-muted">{slotNum}</span>
                    <span className="text-[9px] uppercase font-semibold text-muted">Stamp</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reward Goal Description */}
        <div className="rounded-2xl bg-surface-soft p-3 border border-line flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
              Milestone Reward
            </span>
            <p className="text-xs font-bold text-ink truncate">{rewardDescription}</p>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="w-full mt-4">
        {milestoneReached ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center mb-2">
            <p className="text-sm font-bold text-amber-900">
              🎉 Target Achieved! Your voucher is ready.
            </p>
          </div>
        ) : isStampedToday ? (
          <div className="p-4 rounded-2xl bg-brand-soft border border-brand/20 text-center">
            <div className="flex items-center justify-center gap-1.5 text-brand font-bold text-sm">
              <CalendarCheck className="w-4 h-4" />
              <span>Visit Stamped Today!</span>
            </div>
            <p className="text-xs text-muted mt-1">
              Your next daily stamp unlocks tomorrow at 00:00.
            </p>
          </div>
        ) : (
          <Button
            onClick={onStamp}
            isLoading={isLoading}
            className="w-full py-4 text-base font-bold shadow-sm"
          >
            <Award className="w-5 h-5 mr-1" />
            <span>Stamp My Visit Today</span>
          </Button>
        )}
      </div>
    </div>
  );
};
