import React, { useState } from 'react';
import { Phone, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';

interface MobileInputProps {
  onSubmit: (mobile: string, name?: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  businessName: string;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  onSubmit,
  isLoading,
  error,
  businessName,
}) => {
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Strip out any non-digit characters
    const digitsOnly = mobile.replace(/\D/g, '');

    // Strictly enforce exactly 10 digits
    if (digitsOnly.length !== 10) {
      setLocalError('Please enter exactly 10 digits for your mobile number.');
      return;
    }

    await onSubmit(digitsOnly, name);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full text-center mb-5">
        <h2 className="text-xl font-bold text-ink">Welcome Guest</h2>
        <p className="mt-1 text-sm text-muted">
          Enter your mobile number to unlock today's rewards and track your loyalty visits at {businessName}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div>
          <label className="label flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-brand" />
            <span>Mobile Phone Number</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              inputMode="tel"
              placeholder="e.g. 9876543210"
              value={mobile}
              maxLength={10}
              onChange={e => {
                // Instantly strip non-numeric keystrokes
                const numericValue = e.target.value.replace(/\D/g, '');
                setMobile(numericValue);
              }}
              disabled={isLoading}
              className={`field pl-4 ${localError || error ? 'field-error' : ''}`}
              autoFocus
              required
            />
          </div>
          {(localError || error) && (
            <p className="helper-error">{localError || error}</p>
          )}
        </div>

        <div>
          <label className="label flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted" />
            <span>Your Name (Optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Alex"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={isLoading}
            className="field text-base py-3"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full text-base py-4 shadow-sm"
          >
            <span>Continue to Experience</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-muted text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-brand shrink-0" />
          <span>No app download needed. Your number is only used for loyalty & rewards.</span>
        </div>
      </form>
    </div>
  );
};
