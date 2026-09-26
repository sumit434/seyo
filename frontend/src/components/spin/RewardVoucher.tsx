import React, { useState } from 'react';
import { Gift, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button.js';
import { PinPadModal } from '../common/PinPadModal.js';

interface RewardVoucherProps {
  voucher: {
    rewardId?: string;
    code: string;
    title: string;
    type: 'spin' | 'loyalty';
    claimedAt: string;
  };
  businessId: string;
  customerId: string;
  businessName: string;
  onRedeemed: (reward: any) => void;
  onContinue: () => void;
}

export const RewardVoucher: React.FC<RewardVoucherProps> = ({
  voucher,
  businessId,
  customerId,
  businessName,
  onRedeemed,
  onContinue,
}) => {
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isRedeemed, setIsRedeemed] = useState(false);

  const handleRedeemSuccess = (reward: any) => {
    setIsRedeemed(true);
    onRedeemed(reward);
  };

  return (
    <div className="w-full flex flex-col items-center animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft text-brand-dark text-xs font-bold uppercase tracking-wider mb-1.5">
          <Gift className="w-3.5 h-3.5" />
          <span>{voucher.type === 'spin' ? 'Instant Dining Reward' : 'Milestone Loyalty Reward'}</span>
        </div>
        <h2 className="text-xl font-black text-ink">Your Reward Voucher</h2>
        <p className="text-xs text-muted">
          Present this screen to your server when placing your order.
        </p>
      </div>

      {/* Modern Voucher Ticket */}
      <div className="w-full rounded-3xl border-2 border-dashed border-brand/40 bg-white p-5 shadow-sm relative overflow-hidden my-2">
        {/* Decorative corner cutouts */}
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-soft border-r-2 border-dashed border-brand/40" />
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-soft border-l-2 border-dashed border-brand/40" />

        <div className="flex flex-col items-center text-center px-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-3">
            <Gift className="w-6 h-6" />
          </div>

          <span className="text-xs font-semibold text-muted uppercase tracking-wider">
            {businessName}
          </span>
          <h3 className="text-lg font-black text-ink mt-1 mb-3 leading-snug">
            {voucher.title}
          </h3>

          {/* Barcode Mock & Code */}
          <div className="w-full bg-surface-soft rounded-2xl p-3 border border-line flex flex-col items-center">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">
              Voucher Code
            </span>
            <span className="text-2xl font-mono font-black text-brand tracking-widest">
              {voucher.code}
            </span>

            {/* Simulated barcode lines */}
            <div className="flex items-center justify-center gap-[2px] h-6 mt-2 opacity-70">
              {[2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 1, 5, 2, 3, 4, 1, 2, 4, 3, 1, 5, 2].map((w, i) => (
                <div key={i} className="bg-ink h-full rounded-xs" style={{ width: `${w}px` }} />
              ))}
            </div>
          </div>

          {/* Status Indicator */}
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold">
            {isRedeemed ? (
              <span className="text-brand flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified & Claimed</span>
              </span>
            ) : (
              <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Ready for Staff Redemption
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full mt-4 flex flex-col gap-2.5">
        {!isRedeemed ? (
          <Button
            onClick={() => setIsPinModalOpen(true)}
            className="w-full py-4 text-base"
          >
            <Lock className="w-4 h-4 mr-1.5" />
            <span>Staff Redeem (Enter PIN)</span>
          </Button>
        ) : (
          <Button onClick={onContinue} className="w-full py-4 text-base">
            <span>Continue Journey</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        )}
      </div>

      {/* Staff PIN Modal */}
      <PinPadModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        businessId={businessId}
        customerId={customerId}
        voucherCode={voucher.code}
        voucherTitle={voucher.title}
        onSuccess={handleRedeemSuccess}
      />
    </div>
  );
};
