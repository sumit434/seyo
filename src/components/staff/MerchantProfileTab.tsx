import React, { useState, useRef } from 'react';
import { staffApi } from '../../services/staffApi';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import {
  Building2,
  Smile,
  Image as ImageIcon,
  Star,
  Globe,
  Instagram,
  Facebook,
  CheckCircle2,
  AlertCircle,
  Palette,
  ExternalLink,
  Upload,
  Trash2,
} from 'lucide-react';
import { Business } from '../../../shared/types/business';

interface MerchantProfileTabProps {
  business: Business;
  sessionToken: string;
  onUpdated: () => Promise<void>;
}

const COMMON_EMOJIS = ['🏪', '🍕', '☕', '🍔', '💇', '🌮', '🍣', '🍦', '🍷', '🏋️', '🧁', '🥗'];

export const MerchantProfileTab: React.FC<MerchantProfileTabProps> = ({
  business,
  sessionToken,
  onUpdated,
}) => {
  const [name, setName] = useState(business.name || '');
  const [logoEmoji, setLogoEmoji] = useState(business.logoEmoji || '🏪');
  const [logoUrl, setLogoUrl] = useState(business.logoUrl || '');
  const [accentColor, setAccentColor] = useState(business.accentColor || '#0e7c66');
  const [googleReviewUrl, setGoogleReviewUrl] = useState(business.googleReviewUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(business.instagramUrl || '');
  const [websiteUrl, setWebsiteUrl] = useState((business as any).websiteUrl || '');
  const [facebookUrl, setFacebookUrl] = useState((business as any).facebookUrl || '');
  const [zomatoUrl, setZomatoUrl] = useState(business.zomatoUrl || '');
  const [swiggyUrl, setSwiggyUrl] = useState(business.swiggyUrl || '');

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type: .jpg, .jpeg, .png
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    const hasValidMime = validMimes.includes(file.type.toLowerCase());

    if (!hasValidExt && !hasValidMime) {
      setErrorMessage('Invalid file type. Only .jpg, .jpeg, and .png images are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Logo image must be under 3MB in size.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read selected image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogoImage = () => {
    setLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Business name cannot be empty');
      return;
    }

    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await staffApi.updateProfile(sessionToken, {
        name: name.trim(),
        logoEmoji: logoEmoji.trim() || '🏪',
        logoUrl: logoUrl.trim(),
        accentColor: accentColor.trim(),
        googleReviewUrl: googleReviewUrl.trim(),
        instagramUrl: instagramUrl.trim(),
        websiteUrl: websiteUrl.trim(),
        facebookUrl: facebookUrl.trim(),
        zomatoUrl: zomatoUrl.trim(),
        swiggyUrl: swiggyUrl.trim(),
      });

      if (res.success) {
        setSuccessMessage('Merchant profile and branding updated successfully!');
        await onUpdated();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-lg font-bold text-[#10181c] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#0e7c66]" />
            <span>Merchant Profile & Branding</span>
          </h3>
          <p className="text-xs text-[#6a787e] mt-0.5">
            Configure your business details, branding logo, Google review link, and social profiles.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#e2f1ec] border border-[#0e7c66]/30 text-[#0a6252] text-sm font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-[#0e7c66] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Business Identity & Branding */}
        <div className="bg-white rounded-3xl border border-[#e2e7e6] p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-[#e2e7e6]">
            <Building2 className="w-4 h-4 text-[#0e7c66]" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#10181c]">
              Business Identity & Logo
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business / Merchant Name"
              type="text"
              required
              placeholder="e.g. Bella Napoli Pizzeria"
              value={name}
              onChange={e => setName(e.target.value)}
              helperText="Displayed across customer mobile screens, terminal, and receipts"
            />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#10181c] flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-[#0e7c66]" />
                <span>Fallback Logo Emoji</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={logoEmoji}
                  onChange={e => setLogoEmoji(e.target.value)}
                  className="w-16 rounded-2xl border border-[#e2e7e6] bg-[#f8faf9] py-2.5 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-[#0e7c66]"
                />
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {COMMON_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setLogoEmoji(emoji)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-base hover:bg-[#e2e7e6] transition-colors cursor-pointer border ${
                        logoEmoji === emoji ? 'border-[#0e7c66] bg-[#e2f1ec]' : 'border-transparent'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Logo Upload Control */}
          <div className="space-y-2 pt-2 border-t border-[#e2e7e6]">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#10181c] flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-[#0e7c66]" />
                <span>Logo Upload (.jpg, .jpeg, .png)</span>
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogoImage}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Logo</span>
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoFileUpload}
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#f8faf9] border border-[#e2e7e6]">
              {/* Preview Thumbnail */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden border border-[#e2e7e6] shrink-0 text-3xl shadow-xs bg-white"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                ) : (
                  <span>{logoEmoji}</span>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white hover:bg-[#e2e7e6]/50 border border-[#e2e7e6] text-[#10181c] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#0e7c66]" />
                    <span>{logoUrl ? 'Change Logo File' : 'Select Logo from Device'}</span>
                  </button>
                  <span className="text-[11px] text-[#6a787e]">
                    Allowed: <strong className="text-[#10181c]">.jpg, .jpeg, .png</strong> (max 3MB)
                  </span>
                </div>
                <p className="text-[11px] text-[#6a787e]">
                  {logoUrl
                    ? 'Custom brand logo active. Saved to your profile and displayed across customer screens.'
                    : 'No custom image selected. Falling back to the selected brand emoji above.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Input
              label="Logo Image URL (Alternative)"
              type="url"
              placeholder="https://example.com/logo.png"
              value={logoUrl.startsWith('data:') ? '' : logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              leftAddon={<ImageIcon className="w-4 h-4 text-[#6a787e]" />}
              helperText="Or provide an external HTTPS image URL"
            />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#10181c] flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#0e7c66]" />
                <span>Brand Accent Color</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={e => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-[#e2e7e6] p-1"
                />
                <span className="font-mono text-sm font-bold text-[#10181c] bg-[#f1f3f2] px-3 py-1.5 rounded-xl border border-[#e2e7e6]">
                  {accentColor}
                </span>
                <div
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: accentColor }}
                >
                  Live Preview
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Google Review Link */}
        <div className="bg-white rounded-3xl border border-[#e2e7e6] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#e2e7e6]">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#10181c]">
              Google Review Link
            </h4>
          </div>
          <p className="text-xs text-[#6a787e]">
            Customers who give high ratings during the feedback stage will be invited to leave a public review on your Google Business profile.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 w-full">
              <Input
                label="Google Review URL"
                type="url"
                placeholder="https://g.page/r/your-business/review"
                value={googleReviewUrl}
                onChange={e => setGoogleReviewUrl(e.target.value)}
                leftAddon={<Star className="w-4 h-4 text-amber-500" />}
              />
            </div>
            {googleReviewUrl && (
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#0e7c66] hover:underline px-3 py-2.5 rounded-xl bg-[#f8faf9] border border-[#e2e7e6]"
              >
                <span>Test Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Section 3: Social & Web Profiles */}
        <div className="bg-white rounded-3xl border border-[#e2e7e6] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#e2e7e6]">
            <Globe className="w-4 h-4 text-[#0e7c66]" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#10181c]">
              Social & Web Links
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Instagram Profile"
              type="url"
              placeholder="https://instagram.com/yourbusiness"
              value={instagramUrl}
              onChange={e => setInstagramUrl(e.target.value)}
              leftAddon={<Instagram className="w-4 h-4 text-pink-600" />}
            />

            <Input
              label="Official Website"
              type="url"
              placeholder="https://yourbusiness.com"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              leftAddon={<Globe className="w-4 h-4 text-[#0e7c66]" />}
            />

            <Input
              label="Facebook Page"
              type="url"
              placeholder="https://facebook.com/yourbusiness"
              value={facebookUrl}
              onChange={e => setFacebookUrl(e.target.value)}
              leftAddon={<Facebook className="w-4 h-4 text-blue-600" />}
            />

            <Input
              label="Zomato Page (Optional)"
              type="url"
              placeholder="https://zomato.com/..."
              value={zomatoUrl}
              onChange={e => setZomatoUrl(e.target.value)}
              leftAddon={<Globe className="w-4 h-4 text-red-500" />}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="px-8 shadow-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Save Profile & Branding</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
