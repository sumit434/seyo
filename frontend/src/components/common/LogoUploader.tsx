import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Smile } from 'lucide-react';
import { Button } from './Button.js';

interface LogoUploaderProps {
  currentLogoUrl?: string;
  currentEmoji?: string;
  onLogoChange: (data: { logoUrl?: string; logoEmoji?: string }) => void;
}

const COMMON_EMOJIS = ['🍕', '☕', '🍸', '✨', '🍔', '🍣', '🍰', '🥗', '🍷', '✂️', '🛍️', '🏢'];

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  currentLogoUrl,
  currentEmoji = '🏢',
  onLogoChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'emoji'>(currentLogoUrl ? 'upload' : 'emoji');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size exceeds 2MB limit. Please choose a smaller image.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Only image files (PNG, JPG, SVG, WebP) are supported.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onLogoChange({ logoUrl: base64, logoEmoji: currentEmoji });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    onLogoChange({ logoUrl: undefined, logoEmoji: currentEmoji });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectEmoji = (emoji: string) => {
    onLogoChange({ logoUrl: currentLogoUrl, logoEmoji: emoji });
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'upload'
              ? 'bg-brand text-white shadow-xs'
              : 'text-muted hover:text-ink'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Upload Image</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('emoji')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'emoji'
              ? 'bg-brand text-white shadow-xs'
              : 'text-muted hover:text-ink'
          }`}
        >
          <Smile className="w-3.5 h-3.5" />
          <span>Emoji Icon</span>
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div className="flex flex-col gap-2">
          {currentLogoUrl ? (
            <div className="flex items-center gap-4 p-3 bg-surface-soft border border-line rounded-2xl">
              <div className="w-16 h-16 rounded-xl border border-line bg-white overflow-hidden shrink-0 shadow-xs">
                <img
                  src={currentLogoUrl}
                  alt="Brand Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-ink block">Brand Logo Active</span>
                <span className="text-[11px] text-muted block">Image will be displayed on customer screens.</span>
              </div>
              <Button
                variant="danger"
                onClick={handleRemoveImage}
                className="py-1.5 px-2.5 text-xs h-auto"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-line hover:border-brand/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-surface-soft/40 hover:bg-white flex flex-col items-center justify-center gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-ink block">Click to upload logo</span>
                <span className="text-[10px] text-muted block mt-0.5">PNG, JPG, SVG, WebP up to 2MB</span>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 p-3 bg-surface-soft border border-line rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-white border border-line flex items-center justify-center text-2xl shadow-xs">
              {currentEmoji}
            </div>
            <div>
              <span className="text-xs font-bold text-ink block">Current Icon: {currentEmoji}</span>
              <span className="text-[11px] text-muted block">Select an icon below for your brand avatar.</span>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelectEmoji(emoji)}
                className={`h-11 rounded-xl border text-xl flex items-center justify-center transition-all ${
                  currentEmoji === emoji
                    ? 'border-brand bg-brand-soft ring-2 ring-brand/30'
                    : 'border-line bg-white hover:bg-surface-soft'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
};
