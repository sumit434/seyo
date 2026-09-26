import React, { useState } from 'react';
import { Lock, X, Delete } from 'lucide-react';
import { Button } from './Button.js';
import { rewardApi } from '../../services/apiServices.js';

interface PinPadModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  customerId: string;
  voucherCode: string;
  voucherTitle: string;
  onSuccess: (redeemedReward: any) => void;
}

export const PinPadModal: React.FC<PinPadModalProps> = ({
  isOpen,
  onClose,
  businessId,
  customerId,
  voucherCode,
  voucherTitle,
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError('Please enter the full staff PIN');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await rewardApi.redeem(businessId, customerId, voucherCode, pin);
      onSuccess(res.reward);
      handleClear();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid staff PIN. Please try again.');
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-[360px] rounded-3xl bg-white p-6 shadow-pop border border-line flex flex-col items-center text-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-brand">
            <div className="w-8 h-8 rounded-xl bg-brand-soft flex items-center justify-center">
              <Lock className="w-4 h-4 text-brand" />
            </div>
            <span className="text-sm font-semibold text-ink">Staff Verification</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-soft hover:bg-line flex items-center justify-center text-muted hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted mb-1">
          Server / Staff member must enter their authorized PIN to redeem:
        </p>
        <p className="text-sm font-bold text-ink mb-4 px-2 py-1 bg-surface-soft rounded-lg">
          {voucherTitle} ({voucherCode})
        </p>

        {/* PIN Dots */}
        <div className="flex items-center justify-center gap-3 mb-5">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                i < pin.length
                  ? 'bg-brand border-brand scale-110 shadow-xs'
                  : 'bg-surface-soft border-line'
              }`}
            />
          ))}
        </div>

        {error && <p className="mb-3 text-xs font-semibold text-red-600 animate-fadeIn">{error}</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-13 rounded-2xl bg-surface-soft hover:bg-line active:bg-brand-soft active:text-brand text-xl font-bold text-ink transition-colors flex items-center justify-center cursor-pointer select-none"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-13 rounded-2xl bg-surface-soft hover:bg-line text-xs font-semibold text-muted transition-colors flex items-center justify-center cursor-pointer select-none"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-13 rounded-2xl bg-surface-soft hover:bg-line active:bg-brand-soft active:text-brand text-xl font-bold text-ink transition-colors flex items-center justify-center cursor-pointer select-none"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-13 rounded-2xl bg-surface-soft hover:bg-line text-muted transition-colors flex items-center justify-center cursor-pointer select-none"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={pin.length < 4 || isSubmitting}
          isLoading={isSubmitting}
          className="w-full"
        >
          Confirm Redemption
        </Button>
      </div>
    </div>
  );
};
