import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Building2,
  Image as ImageIcon,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Clock,
  KeyRound,
  Lock,
  Plus,
  Trash2,
} from 'lucide-react';
import { onboardingApi, BusinessConfig, SpinWheelSlice } from '../services/apiServices.js';
import { useStaffAuth } from '../context/StaffAuthContext.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Loading } from '../components/common/Loading.js';
import { ErrorMessage } from '../components/common/ErrorMessage.js';
import { LogoUploader } from '../components/common/LogoUploader.js';

export const MerchantOnboardingPage: React.FC = () => {
  const { token: urlToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const token = urlToken || searchParams.get('token') || '';
  const navigate = useNavigate();
  const { setSession } = useStaffAuth();

  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<any>(null);

  // Wizard Step (1 to 5)
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [accentColor, setAccentColor] = useState('#0e7c66');
  const [logoEmoji, setLogoEmoji] = useState('🍽️');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  // Tier configuration
  const [loyaltyTarget, setLoyaltyTarget] = useState(5);
  const [loyaltyReward, setLoyaltyReward] = useState('Free Signature Item & Dessert');
  const [googleReviewUrl, setGoogleReviewUrl] = useState(
    'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4'
  );
  const [googlePlaceId, setGooglePlaceId] = useState('ChIJN1t_tDeuEmsRUsoyG83frY4');
  const [spinSlices, setSpinSlices] = useState<Array<{ id: string; rewardLabel: string; emoji: string; weight: number }>>([
    { id: 'sw_1', rewardLabel: '20% Off Main Course', emoji: '🍝', weight: 35 },
    { id: 'sw_2', rewardLabel: 'Complimentary Mocktail', emoji: '🍹', weight: 30 },
    { id: 'sw_3', rewardLabel: 'Free Appetizer Platter', emoji: '🥖', weight: 20 },
    { id: 'sw_4', rewardLabel: 'Chef Surprise Dessert', emoji: '🍨', weight: 15 },
  ]);
  const [offerDurationDays, setOfferDurationDays] = useState(30);

  // Security Credentials
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [confirmStaffPin, setConfirmStaffPin] = useState('');
  const [acknowledgedImmutability, setAcknowledgedImmutability] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setValidationError('No onboarding token provided in link. Please use the link sent via email.');
      setIsValidating(false);
      return;
    }

    const validate = async () => {
      try {
        const res = await onboardingApi.validateToken(token);
        if (res.success && res.tokenData) {
          setTokenData(res.tokenData);
          if (res.tokenData.businessName) {
            setName(res.tokenData.businessName);
          }
        }
      } catch (err: any) {
        setValidationError(err.message || 'Invalid or expired onboarding magic link.');
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [token]);

  // Spin slice calculations
  const totalWeight = spinSlices.reduce((sum, s) => sum + (Number(s.weight) || 0), 0);
  const tier = tokenData?.tier || 'combined';

  const handleAddSlice = () => {
    if (spinSlices.length >= 8) return;
    setSpinSlices([
      ...spinSlices,
      {
        id: `sw_${Date.now()}`,
        rewardLabel: 'Special Treat',
        emoji: '🎁',
        weight: 0,
      },
    ]);
  };

  const handleRemoveSlice = (index: number) => {
    if (spinSlices.length <= 2) return;
    setSpinSlices(spinSlices.filter((_, i) => i !== index));
  };

  const handleUpdateSlice = (index: number, field: string, value: any) => {
    const updated = [...spinSlices];
    updated[index] = { ...updated[index], [field]: value };
    setSpinSlices(updated);
  };

  // Step Navigations & Validations
  const handleNext = () => {
    setFormError(null);
    if (step === 1) {
      if (!name.trim()) return setFormError('Please enter your business or restaurant name.');
      if (!category.trim()) return setFormError('Please specify your establishment category (e.g. Café, Bistro, Salon).');
      if (!address.trim()) return setFormError('Please provide your establishment address.');
    } else if (step === 3) {
      if (tier === 'spin' || tier === 'combined') {
        if (Math.abs(totalWeight - 100) > 0.01) {
          return setFormError(`Spin wheel slice weights must sum to exactly 100%. Current total: ${totalWeight}%`);
        }
      }
      if (tier === 'loyalty' || tier === 'combined') {
        if (!loyaltyReward.trim()) {
          return setFormError('Please enter the milestone loyalty reward description.');
        }
      }
    } else if (step === 4) {
      if (password.length < 6) {
        return setFormError('Staff password must be at least 6 characters long.');
      }
      if (password !== confirmPassword) {
        return setFormError('Passwords do not match.');
      }
      if (!/^\d{4}$/.test(staffPin)) {
        return setFormError('Server Voucher PIN must be exactly 4 numeric digits.');
      }
      if (staffPin !== confirmStaffPin) {
        return setFormError('Staff PINs do not match.');
      }
    }

    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!acknowledgedImmutability) {
      setFormError('Please check the box to acknowledge the Offer Immutability Rule.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        token,
        name: name.trim(),
        category: category.trim(),
        address: address.trim(),
        timezone,
        accentColor,
        logoEmoji,
        logoUrl,
        googleReviewUrl,
        googlePlaceId,
        password,
        staffPin,
        loyaltyTarget,
        loyaltyReward,
        spinWheelConfiguration: spinSlices,
        offerDurationDays,
      };

      const res = await onboardingApi.complete(token, payload);
      if (res.success && res.sessionToken) {
        setSession(res.sessionToken, res.business);
        navigate('/staff/terminal', {
          state: { newlyOnboarded: true, businessName: res.business.name },
        });
      }
    } catch (err: any) {
      setFormError(err.message || 'Onboarding completion failed. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <Loading message="Validating Magic Link..." subtext="Checking 15-minute security session token" />
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-line rounded-3xl p-8 shadow-sm text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-ink mb-2">Onboarding Link Invalid</h2>
          <p className="text-xs text-muted mb-6 leading-relaxed">{validationError}</p>
          <Button onClick={() => navigate('/')} className="w-full py-3">
            Return to Directory & Simulation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Onboarding Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand text-white flex items-center justify-center font-black text-lg shadow-xs">
              S
            </div>
            <div>
              <span className="text-xs font-bold text-brand uppercase tracking-wider">SEYO Merchant Setup</span>
              <h1 className="text-xl font-extrabold text-ink">Welcome to SEYO Enterprise</h1>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-soft text-brand-dark uppercase">
            {tier} Tier
          </span>
        </div>

        {/* Stepper Progress */}
        <div className="bg-white border border-line rounded-2xl p-4 shadow-xs flex items-center justify-between">
          {[
            { num: 1, label: 'Identity' },
            { num: 2, label: 'Branding' },
            { num: 3, label: 'Campaign' },
            { num: 4, label: 'Security' },
            { num: 5, label: 'Launch' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.num
                    ? 'bg-brand text-white shadow-xs'
                    : step > s.num
                    ? 'bg-brand-soft text-brand'
                    : 'bg-surface-soft text-muted'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-xs hidden sm:inline ${step === s.num ? 'font-bold text-ink' : 'text-muted'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {formError && <ErrorMessage message={formError} onDismiss={() => setFormError(null)} />}

        {/* Step 1: Business Identity */}
        {step === 1 && (
          <div className="bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Step 1: Establishment Details</h2>
                <p className="text-xs text-muted">Tell us about your establishment</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Input
                label="Establishment Name"
                placeholder="e.g. The Rustic Fork Bistro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Category / Cuisine"
                placeholder="e.g. Artisanal Italian Dining, Specialty Coffee, Luxury Salon"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />

              <Input
                label="Street Address / Location"
                placeholder="e.g. 42 Heritage Boulevard, Downtown Square"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">Operating Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-2xl border border-line bg-surface-soft p-3 text-xs font-semibold focus:outline-brand"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">Brand Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-line"
                    />
                    <span className="text-xs font-mono font-bold text-ink">{accentColor}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-line">
              <Button onClick={handleNext} className="py-2.5 px-6 text-xs font-bold">
                Continue to Branding
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Branding & Logo Upload */}
        {step === 2 && (
          <div className="bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Step 2: Brand Identity & Logo</h2>
                <p className="text-xs text-muted">Upload your brand logo or choose an emoji badge</p>
              </div>
            </div>

            <LogoUploader
              currentLogoUrl={logoUrl}
              currentEmoji={logoEmoji}
              onLogoChange={({ logoUrl: newUrl, logoEmoji: newEmoji }) => {
                if (newUrl !== undefined) setLogoUrl(newUrl);
                if (newEmoji !== undefined) setLogoEmoji(newEmoji);
              }}
            />

            <div className="flex justify-between pt-4 border-t border-line">
              <Button variant="secondary" onClick={() => setStep(1)} className="py-2.5 px-5 text-xs">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
              <Button onClick={handleNext} className="py-2.5 px-6 text-xs font-bold">
                Continue to Campaign Setup
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Tier & Offer Configuration */}
        {step === 3 && (
          <div className="bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Step 3: Initial Offer & Rewards</h2>
                <p className="text-xs text-muted">Configure the reward mechanics for your commercial tier</p>
              </div>
            </div>

            {/* Spin & Win Configuration (Combined or Spin) */}
            {(tier === 'spin' || tier === 'combined') && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Spin & Win Wheel Slices</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${
                        Math.abs(totalWeight - 100) < 0.01
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      Total Weight: {totalWeight}%
                    </span>
                    <Button
                      variant="secondary"
                      onClick={handleAddSlice}
                      disabled={spinSlices.length >= 8}
                      className="py-1 px-2.5 text-xs h-auto"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Slice
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {spinSlices.map((slice, idx) => (
                    <div
                      key={slice.id}
                      className="flex items-center gap-2 p-2.5 bg-surface-soft border border-line rounded-2xl"
                    >
                      <input
                        type="text"
                        value={slice.emoji}
                        onChange={(e) => handleUpdateSlice(idx, 'emoji', e.target.value)}
                        className="w-10 text-center text-lg p-1 bg-white border border-line rounded-xl"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        value={slice.rewardLabel}
                        onChange={(e) => handleUpdateSlice(idx, 'rewardLabel', e.target.value)}
                        placeholder="Reward Label"
                        className="flex-1 text-xs font-semibold p-2 bg-white border border-line rounded-xl"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={slice.weight}
                          onChange={(e) => handleUpdateSlice(idx, 'weight', Number(e.target.value) || 0)}
                          className="w-16 text-center text-xs font-bold p-2 bg-white border border-line rounded-xl font-mono"
                          min={1}
                          max={100}
                        />
                        <span className="text-xs text-muted font-bold">%</span>
                      </div>
                      {spinSlices.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSlice(idx)}
                          className="p-1.5 text-muted hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loyalty Configuration (Combined or Loyalty) */}
            {(tier === 'loyalty' || tier === 'combined') && (
              <div className="flex flex-col gap-3 pt-3 border-t border-line">
                <span className="text-xs font-bold text-ink">Digital Loyalty Stamp Settings</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Target Visits</label>
                    <input
                      type="number"
                      value={loyaltyTarget}
                      onChange={(e) => setLoyaltyTarget(Math.max(1, Number(e.target.value) || 5))}
                      className="w-full rounded-2xl border border-line bg-surface-soft p-3 text-xs font-bold text-center"
                      min={1}
                      max={20}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-muted mb-1">Milestone Reward Description</label>
                    <input
                      type="text"
                      value={loyaltyReward}
                      onChange={(e) => setLoyaltyReward(e.target.value)}
                      placeholder="e.g. Free Artisanal Pizza & Drink"
                      className="w-full rounded-2xl border border-line bg-surface-soft p-3 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Google Review Integration */}
            <div className="flex flex-col gap-3 pt-3 border-t border-line">
              <span className="text-xs font-bold text-ink">Google Review Booster Destination</span>
              <Input
                label="Google Review URL"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                placeholder="https://search.google.com/local/writereview?placeid=..."
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-line">
              <Button variant="secondary" onClick={() => setStep(2)} className="py-2.5 px-5 text-xs">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
              <Button onClick={handleNext} className="py-2.5 px-6 text-xs font-bold">
                Continue to Security
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Security Credentials */}
        {step === 4 && (
          <div className="bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Step 4: Terminal & Staff Security</h2>
                <p className="text-xs text-muted">Set up your staff portal password and server 4-digit PIN</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="p-3 bg-brand-soft/40 border border-brand/20 rounded-2xl text-xs text-brand-dark flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0 text-brand" />
                <span>Account Email: <strong>{tokenData?.email}</strong></span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="password"
                  label="Staff Portal Password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  label="Confirm Password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <KeyRound className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">4-Digit Server PIN</span>
                    <span className="text-[11px] text-amber-800 block mt-0.5">
                      Your waitstaff will enter this 4-digit PIN on guest phones to authorize voucher redemptions.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
                  <Input
                    type="password"
                    maxLength={4}
                    label="4-Digit PIN"
                    placeholder="e.g. 1234"
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                  <Input
                    type="password"
                    maxLength={4}
                    label="Confirm 4-Digit PIN"
                    placeholder="e.g. 1234"
                    value={confirmStaffPin}
                    onChange={(e) => setConfirmStaffPin(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-line">
              <Button variant="secondary" onClick={() => setStep(3)} className="py-2.5 px-5 text-xs">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
              <Button onClick={handleNext} className="py-2.5 px-6 text-xs font-bold">
                Review & Confirm
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Review & Activate */}
        {step === 5 && (
          <div className="bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Step 5: Review & Launch Campaign</h2>
                <p className="text-xs text-muted">Review configuration and activate your SEYO enterprise engagement</p>
              </div>
            </div>

            <div className="p-4 bg-surface-soft border border-line rounded-2xl flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-muted">Business:</span>
                <span className="font-bold text-ink">{name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-muted">Tier:</span>
                <span className="font-bold text-brand uppercase">{tier} Tier</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-muted">Campaign Duration:</span>
                <span className="font-bold text-ink">{offerDurationDays} Days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Voucher Redemption PIN:</span>
                <span className="font-mono font-bold text-ink">••••</span>
              </div>
            </div>

            {/* Immutability Rule Notice */}
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-extrabold text-amber-950 block uppercase tracking-wider">
                    Strict Offer Immutability Rule
                  </span>
                  <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                    Once activated, this campaign configuration (wheel slice weights, rewards, and loyalty target)
                    is <strong>immutable</strong> and locked in for customer audit integrity. To alter parameters
                    while running, you must cancel this campaign and publish a new offer.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2.5 mt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acknowledgedImmutability}
                  onChange={(e) => setAcknowledgedImmutability(e.target.checked)}
                  className="w-4 h-4 rounded text-brand focus:ring-brand"
                />
                <span className="text-xs font-bold text-amber-950">
                  I understand and accept that active offer settings cannot be modified once launched.
                </span>
              </label>
            </div>

            <div className="flex justify-between pt-4 border-t border-line">
              <Button variant="secondary" onClick={() => setStep(4)} className="py-2.5 px-5 text-xs">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !acknowledgedImmutability}
                className="py-3 px-8 text-xs font-bold"
              >
                {isSubmitting ? 'Launching SEYO...' : 'Launch SEYO & Enter Terminal'}
                <Sparkles className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
