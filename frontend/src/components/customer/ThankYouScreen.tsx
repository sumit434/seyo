import React from 'react';
import { Heart, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button.js';
import { CustomerStatus } from '../../services/apiServices.js';

interface ThankYouScreenProps {
  businessName: string;
  status: CustomerStatus;
  onRefresh: () => void;
}

export const ThankYouScreen: React.FC<ThankYouScreenProps> = ({
  businessName,
  status,
  onRefresh,
}) => {
  return (
    <div className="w-full flex flex-col items-center text-center p-2 animate-fadeIn">
      <div className="w-20 h-20 rounded-3xl bg-brand-soft border-2 border-brand/20 flex items-center justify-center text-brand mb-4 shadow-sm">
        <Heart className="w-10 h-10 text-brand fill-brand" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft text-brand-dark text-xs font-bold uppercase tracking-wider mb-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Journey Complete</span>
      </div>

      <h2 className="text-2xl font-black text-ink mb-2">
        Thank You For Visiting!
      </h2>

      <p className="text-sm text-muted mb-6 max-w-xs leading-relaxed">
        We truly appreciate your visit to {businessName}. We look forward to welcoming you back soon!
      </p>

      {/* Completed checklist */}
      <div className="w-full rounded-2xl border border-line bg-surface-soft p-4 text-left mb-6 space-y-2.5">
        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-line">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-brand" />
            <span className="text-xs font-semibold text-ink">Lifetime Visits Tracked</span>
          </div>
          <span className="text-xs font-bold text-brand">{status.totalVisits} visits</span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-line">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-brand" />
            <span className="text-xs font-semibold text-ink">Total Rewards Claimed</span>
          </div>
          <span className="text-xs font-bold text-brand">{status.totalRewardsClaimed} claimed</span>
        </div>

        {status.reviewJourneyCompleted && (
          <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-line">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-brand" />
              <span className="text-xs font-semibold text-ink">Google Review Shared</span>
            </div>
            <span className="text-xs font-bold text-brand">Completed</span>
          </div>
        )}
      </div>

      <Button variant="secondary" onClick={onRefresh} className="w-full text-sm py-3">
        <RefreshCw className="w-4 h-4 mr-1.5" />
        Refresh Session
      </Button>
    </div>
  );
};
