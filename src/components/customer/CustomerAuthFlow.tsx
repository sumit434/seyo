import React, { useState } from 'react';
import { ALLOWED_COUNTRIES, getCountryPhoneLength } from '../../../shared/constants/countries';
import { customerAuthService } from '../../services/customerAuthService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { User, ArrowRight, ShieldCheck, Sparkles, Radio } from 'lucide-react';
import { CustomerStatusResponse } from '../../../shared/types/qr';

interface CustomerAuthFlowProps {
  businessId: string;
  businessName: string;
  logoEmoji: string;
  accentColor: string;
  sessionKey?: string;
  isViewOnly?: boolean;
  onAuthenticated: (payload: { sessionToken: string; sessionKey?: string } & CustomerStatusResponse) => void;
}

export const CustomerAuthFlow: React.FC<CustomerAuthFlowProps> = ({
  businessId,
  businessName,
  logoEmoji,
  accentColor,
  sessionKey,
  isViewOnly = false,
  onAuthenticated,
}) => {
  const [countryCode, setCountryCode] = useState('+1');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCountry = ALLOWED_COUNTRIES.find(c => c.dialCode === countryCode) || ALLOWED_COUNTRIES[0];
  const requiredLength = getCountryPhoneLength(countryCode);

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    const newLen = getCountryPhoneLength(newCode);
    if (mobile.length > newLen) {
      setMobile(mobile.slice(0, newLen));
    }
    setError(null);
  };

  const handleMobileChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length <= requiredLength) {
      setMobile(clean);
      setError(null);
    }
  };

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly || !sessionKey) {
      setError('Tap the NFC tag at the counter to collect your stamp.');
      return;
    }

    const cleanDigits = mobile.replace(/\D/g, '');
    if (cleanDigits.length < requiredLength) {
      setError(`Mobile number for ${selectedCountry.name} (${countryCode}) must be exactly ${requiredLength} digits (${cleanDigits.length} entered)`);
      return;
    }
    if (cleanDigits.length > requiredLength) {
      setError(`Mobile number for ${selectedCountry.name} (${countryCode}) must be exactly ${requiredLength} digits`);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await customerAuthService.identify(
        businessId,
        cleanDigits,
        name.trim() || undefined,
        countryCode,
        sessionKey
      );
      onAuthenticated(res);
    } catch (err: any) {
      if (
        err.status === 403 ||
        err.code === 'SESSION_ALREADY_USED' ||
        err.data?.error === 'SESSION_ALREADY_USED' ||
        err.message?.toLowerCase().includes('already used') ||
        err.message?.toLowerCase().includes('expired') ||
        err.message?.includes('403')
      ) {
        setError('Token already used or expired');
      } else {
        setError(err.message || 'Unable to start customer session. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-3xl border border-[#e2e7e6] shadow-lg p-6 sm:p-8 text-left">
      <div className="flex flex-col items-center text-center mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-3 border border-[#e2e7e6]"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <span>{logoEmoji}</span>
        </div>
        <h2 className="text-xl font-bold text-[#10181c]">{businessName}</h2>
        <p className="text-xs text-[#6a787e] mt-1">
          Enter your mobile number to unlock today's rewards
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {isViewOnly && (
        <div className="mb-5 p-4 rounded-2xl bg-[#e2f1ec] border border-[#0e7c66]/30 text-center space-y-1.5 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-[#0e7c66] text-white flex items-center justify-center mx-auto mb-1">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <h3 className="font-extrabold text-[#10181c] text-sm leading-snug">
            Tap the NFC tag at the counter to collect your stamp.
          </h3>
          <p className="text-xs text-[#6a787e]">
            This station is in view-only mode. Tap the physical NFC tag at the counter to unlock your rewards.
          </p>
        </div>
      )}

      <form onSubmit={handleDirectLogin} className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-[#10181c]">Mobile Number</label>
            <span
              className={`text-[11px] font-mono font-medium ${
                mobile.length === requiredLength ? 'text-[#0e7c66] font-bold' : 'text-[#6a787e]'
              }`}
            >
              {mobile.length} / {requiredLength} digits
            </span>
          </div>

          <div className="flex gap-2">
            <select
              value={countryCode}
              disabled={isViewOnly}
              onChange={e => handleCountryCodeChange(e.target.value)}
              className="w-28 rounded-2xl border border-[#e2e7e6] bg-white px-2 py-3.5 text-base font-semibold text-[#10181c] focus:outline-none focus:ring-2 focus:ring-[#0e7c66] disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {ALLOWED_COUNTRIES.map(c => (
                <option key={c.code} value={c.dialCode}>
                  {c.flagEmoji} {c.dialCode}
                </option>
              ))}
            </select>

            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={requiredLength}
              placeholder={`Enter ${requiredLength} digits`}
              value={mobile}
              disabled={isViewOnly}
              onChange={e => handleMobileChange(e.target.value)}
              className="flex-1 rounded-2xl border border-[#e2e7e6] bg-white px-4 py-3.5 text-base text-[#10181c] font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#0e7c66] disabled:bg-gray-100 disabled:cursor-not-allowed"
              autoFocus={!isViewOnly}
            />
          </div>
          <p className="text-[11px] text-[#6a787e] px-1">
            {selectedCountry.name} ({countryCode}) requires exactly {requiredLength} digits
          </p>
        </div>

        <Input
          label="Your Name (Optional)"
          type="text"
          placeholder="e.g. Alex Chen"
          value={name}
          disabled={isViewOnly}
          onChange={e => setName(e.target.value)}
          leftAddon={<User className="w-5 h-5 text-[#0e7c66]" />}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isViewOnly}
          isLoading={isLoading}
          className="gap-2 shadow-sm"
        >
          {isViewOnly ? (
            <span>Tap NFC Tag at Counter to Unlock</span>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Unlock & Continue</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>

        <p className="text-[11px] text-center text-[#6a787e] flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0e7c66]" />
          <span>Fast direct access • No OTP required</span>
        </p>
      </form>
    </div>
  );
};
