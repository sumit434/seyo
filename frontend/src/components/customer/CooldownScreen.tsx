import React from 'react';
import { Moon, Sparkles, Award, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button.js';
import { CustomerStatus } from '../../services/apiServices.js';

interface CooldownScreenProps {
  businessName: string;
  status: CustomerStatus;
  onRefresh: () => void;
  onContinueReview?: () => void;
}

export const CooldownScreen: React.FC<CooldownScreenProps> = ({
  businessName,
  status,
  onRefresh,
  onContinueReview,
}) => {
  return (
    <div className="w-full flex flex-col items-center text-center p-2 animate-fadeIn">
      {/* Icon Badge */}
      <div className="w-20 h-20 rounded-3xl bg-brand-soft border-2 border-brand/20 flex items-center justify-center text-brand mb-4 shadow-sm">
        <Moon className="w-10 h-10 text-brand" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft text-brand-dark text-xs font-bold uppercase tracking-wider mb-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Midnight Cooldown</span>
      </div>

      <h2 className="text-2xl font-black text-ink mb-2">
        You're All Set For Today!
      </h2>

      <p className="text-sm text-muted mb-6 max-w-xs leading-relaxed">
        Your daily offer will reset at midnight 00:00 ({status.timezone}). Thank you for visiting {businessName}!
      </p>

      {/* Customer Status Summary Card */}
      <div className="w-full rounded-2xl border border-line bg-surface-soft p-4 text-left mb-6">
        <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
          Your Account Snapshot
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 border border-line">
            <span className="text-xs text-muted block">Loyalty Cycle</span>
            <span className="text-lg font-black text-ink">
              {status.visitCount} / {status.loyaltyTarget}
            </span>
            <span className="text-[10px] text-brand block mt-0.5 font-medium">
              {status.loyaltyTarget - status.visitCount > 0
                ? `${status.loyaltyTarget - status.visitCount} visits to reward`
                : 'Target achieved!'}
            </span>
          </div>
          <div className="bg-white rounded-xl p-3 border border-line">
            <span className="text-xs text-muted block">Lifetime Visits</span>
            <span className="text-lg font-black text-ink">{status.totalVisits}</span>
            <span className="text-[10px] text-muted block mt-0.5">
              {status.totalRewardsClaimed} rewards earned
            </span>
          </div>
        </div>
      </div>

      {status.reviewAvailable && onContinueReview && (
        <div className="w-full mb-3">
          <Button onClick={onContinueReview} className="w-full">
            <Award className="w-4 h-4 mr-1.5" />
            Share Google Review
          </Button>
        </div>
      )}

      <Button variant="secondary" onClick={onRefresh} className="w-full text-sm py-3">
        <RefreshCw className="w-4 h-4 mr-1.5" />
        Refresh Status
      </Button>
    </div>
  );
};
