import React, { useState } from 'react';
import { Button } from '../common/Button';
import { customerService } from '../../services/customerService';
import { Gift, CheckCircle, ShieldCheck, ArrowRight, Lock } from 'lucide-react';

interface RewardVoucherProps {
  voucher: {
    rewardId: string;
    code: string;
    title: string;
    type: 'spin' | 'loyalty';
    claimedAt: string;
  };
  businessName: string;
  businessId?: string;
  customerId?: string;
  onRedeemed: () => void;
  onContinue: () => void;
}

export const RewardVoucher: React.FC<RewardVoucherProps> = ({
  voucher,
  businessName,
  businessId,
  customerId,
  onRedeemed,
  onContinue,
}) => {
  const [staffPin, setStaffPin] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isDeferring, setIsDeferring] = useState(false);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDefer = async () => {
    if (!businessId || !customerId) {
      onContinue();
      return;
    }
    setIsDeferring(true);
    setError(null);
    try {
      await customerService.deferVoucher(businessId, customerId);
      onContinue();
    } catch (err: any) {
      setError(err.message || 'Could not proceed. Please try again.');
    } finally {
      setIsDeferring(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(staffPin)) {
      setError('Staff PIN must be exactly 4 digits');
      return;
    }

    if (!businessId) {
      setError('Business context missing. Please ask staff to redeem at terminal.');
      return;
    }

    setIsRedeeming(true);
    setError(null);
    try {
      // Call redemption endpoint with staff pin
      await customerService.redeemVoucher(businessId, voucher.code, staffPin);
      setIsRedeemed(true);
      onRedeemed();
    } catch (err: any) {
      setError(err.message || 'Invalid Staff PIN. Please ask staff for assistance.');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-3xl border border-[#e2e7e6] shadow-xl overflow-hidden text-left">
      {/* Voucher Header */}
      <div className="bg-[#0e7c66] text-white p-6 text-center relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-3">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <span className="text-xs uppercase tracking-widest font-bold text-[#e2f1ec]">
            {voucher.type === 'spin' ? '🎡 Spin Reward Voucher' : '⭐ Loyalty Milestone Reward'}
          </span>
          <h3 className="text-2xl font-black mt-1 leading-tight text-center">{voucher.title}</h3>
          <p className="text-xs text-white/80 mt-1">{businessName}</p>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -left-3 bottom-[-14px] w-7 h-7 rounded-full bg-[#f1f3f2]" />
        <div className="absolute -right-3 bottom-[-14px] w-7 h-7 rounded-full bg-[#f1f3f2]" />
      </div>

      {/* Voucher Body */}
      <div className="p-6 space-y-6">
        {/* Code Display */}
        <div className="bg-[#f1f3f2] p-4 rounded-2xl border border-dashed border-[#e2e7e6] text-center">
          <p className="text-xs font-semibold text-[#6a787e] uppercase tracking-wider mb-1">
            Voucher Passcode
          </p>
          <p className="text-3xl font-black tracking-widest font-mono text-[#10181c]">
            {voucher.code}
          </p>
        </div>

        {isRedeemed ? (
          <div className="p-4 rounded-2xl bg-[#e2f1ec] border border-[#0e7c66]/30 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#0e7c66] text-white mx-auto flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-[#0e7c66] text-base">Voucher Redeemed!</h4>
              <p className="text-xs text-[#0a6252] mt-0.5">
                Thank you! Your reward has been confirmed by staff.
              </p>
            </div>
            <Button onClick={onContinue} variant="primary" fullWidth className="gap-2 mt-2">
              <span>Continue Journey</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className="border border-[#e2e7e6] rounded-2xl p-4 bg-[#f8faf9] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#10181c]">
              <Lock className="w-4 h-4 text-[#0e7c66]" />
              <span>Staff Verification (On-Site)</span>
            </div>
            <p className="text-xs text-[#6a787e] leading-relaxed">
              Show this voucher to your server. Staff will enter their 4-digit PIN to activate your treat.
            </p>

            <form onSubmit={handleRedeem} className="space-y-3 pt-1">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Enter 4-digit Staff PIN"
                value={staffPin}
                onChange={e => {
                  setStaffPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                  if (error) setError(null);
                }}
                className="w-full text-center text-xl font-mono tracking-widest py-3 px-4 rounded-xl border border-[#e2e7e6] bg-white focus:outline-none focus:ring-2 focus:ring-[#0e7c66]"
              />
              <p className="text-[11px] text-[#6a787e] text-center">
                Merchant terminal verification PIN (Default: <strong className="font-mono text-[#0e7c66]">7788</strong>)
              </p>

              {error && (
                <p className="text-xs font-medium text-red-600 text-center">{error}</p>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isRedeeming}
                disabled={staffPin.length !== 4}
                className="text-sm py-3"
              >
                <span>Verify & Redeem</span>
              </Button>

              <button
                type="button"
                onClick={handleDefer}
                disabled={isDeferring}
                className="w-full text-center text-xs text-[#6a787e] hover:text-[#10181c] font-semibold py-2 underline cursor-pointer"
              >
                {isDeferring ? 'Saving...' : 'Redeem Later & Proceed to Review Check →'}
              </button>
            </form>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6a787e]">
          <ShieldCheck className="w-4 h-4 text-[#0e7c66]" />
          <span>Server-authoritative tamperproof voucher</span>
        </div>
      </div>
    </div>
  );
};
