import React, { useState } from 'react';
import { Star, Sparkles, Copy, Check, ExternalLink, MessageSquareQuote, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button.js';
import { reviewApi } from '../../services/apiServices.js';

interface ReviewBoosterProps {
  businessId: string;
  customerId: string;
  businessName: string;
  onSuccess: () => void;
}

export const ReviewBooster: React.FC<ReviewBoosterProps> = ({
  businessId,
  customerId,
  businessName,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Delicious Quality',
    'Warm Hospitality',
  ]);
  const [note, setNote] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPersisting, setIsPersisting] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const availableTags = [
    'Delicious Quality',
    'Warm Hospitality',
    'Quick Service',
    'Vibrant Ambiance',
    'Spotless Clean',
    'Great Value',
    'Fresh Ingredients',
    'Family Friendly',
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await reviewApi.generateSuggestions(businessId, rating, selectedTags, note);
      setSuggestions(res.suggestions);
      if (res.suggestions.length > 0) {
        setSelectedText(res.suggestions[0]);
      }
    } catch {
      setError('Could not generate review drafts. You can write your custom review below.');
      setSelectedText(
        `Had a wonderful visit to ${businessName}! The service and experience were top tier. Highly recommended!`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAndOpenGoogle = async () => {
    if (!selectedText.trim()) {
      setError('Please select or enter review text before continuing.');
      return;
    }

    setIsPersisting(true);
    setError(null);

    try {
      // 1. Mandatory requirement: Persist to backend BEFORE redirecting to Google
      const res = await reviewApi.persist(
        businessId,
        customerId,
        selectedText.trim(),
        rating,
        selectedTags
      );

      // 2. Copy review to clipboard
      try {
        await navigator.clipboard.writeText(selectedText.trim());
        setIsCopied(true);
      } catch {
        // Fallback copy
      }

      // 3. Log Google Handoff
      if (res.reviewLog?.id) {
        reviewApi.logGoogleOpened(res.reviewLog.id).catch(() => {});
      }

      // 4. Open Google Review URL
      if (res.googleReviewUrl) {
        // Safe navigation to merchant's Google Review destination
        window.open(res.googleReviewUrl, '_blank', 'noopener,noreferrer');
      }

      // 5. Complete stage in UI
      onSuccess();
    } catch (err: any) {
      setError(
        err.message ||
          'Failed to record review persistence. Please check your connection and retry.'
      );
    } finally {
      setIsPersisting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft text-brand-dark text-xs font-bold uppercase tracking-wider mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Review Booster</span>
        </div>
        <h2 className="text-xl font-black text-ink">Share Your 5-Star Feedback</h2>
        <p className="text-xs text-muted">
          Generate an authentic, polished Google Review in seconds for {businessName}.
        </p>
      </div>

      {/* Step 1: Star Rating */}
      <div className="w-full rounded-3xl border border-line bg-white p-5 shadow-sm my-1">
        <span className="text-xs font-bold text-muted uppercase tracking-wider block text-center mb-2">
          Your Rating
        </span>
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1 text-amber-400 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            >
              <Star
                className={`w-9 h-9 ${
                  star <= rating ? 'fill-amber-400 text-amber-400' : 'text-line'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Step 2: What stood out? */}
        <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">
          What did you enjoy most?
        </span>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {availableTags.map(tag => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-surface-soft text-muted hover:text-ink border border-line'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Step 3: Optional User Note */}
        <div className="mb-4">
          <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">
            Add a personal detail (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Loved the garlic bread and the polite waiter"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="field text-sm py-2.5"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          isLoading={isGenerating}
          variant={suggestions.length > 0 ? 'secondary' : 'primary'}
          className="w-full py-3.5 text-sm"
        >
          {suggestions.length > 0 ? (
            <>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              <span>Regenerate AI Drafts</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span>Generate AI Review Options</span>
            </>
          )}
        </Button>
      </div>

      {/* Step 4: Review Suggestions & Selection */}
      {(suggestions.length > 0 || selectedText) && (
        <div className="w-full rounded-3xl border border-brand/30 bg-brand-soft/40 p-5 shadow-sm mt-3 animate-fadeIn">
          <div className="flex items-center gap-2 mb-2 text-brand">
            <MessageSquareQuote className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-dark">
              Review Preview & Handoff
            </span>
          </div>

          {/* If multiple suggestions, show quick selector pills */}
          {suggestions.length > 1 && (
            <div className="flex gap-2 mb-3">
              {suggestions.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedText(suggestions[idx])}
                  className={`flex-1 py-1 text-xs font-bold rounded-lg border transition-colors ${
                    selectedText === suggestions[idx]
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-muted border-line hover:text-ink'
                  }`}
                >
                  Option {idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* Editable Text Area for Custom Polish */}
          <textarea
            value={selectedText}
            onChange={e => setSelectedText(e.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-line bg-white p-3 text-sm text-ink leading-relaxed focus:border-brand focus:outline-none resize-none shadow-xs"
            placeholder="Review text..."
          />

          {error && <p className="text-xs font-semibold text-red-600 mt-2">{error}</p>}

          {/* Primary Action Button: Persist & Open Google */}
          <div className="mt-4">
            <Button
              onClick={handleCopyAndOpenGoogle}
              isLoading={isPersisting}
              className="w-full py-4 text-base font-bold shadow-md bg-brand hover:bg-brand-dark"
            >
              {isCopied ? (
                <>
                  {/* <Check className="w-5 h-5 mr-1" /> */}
                  <span>Copied! Opening Google Reviews...</span>
                </>
              ) : (
                <>
                  {/* <Copy className="w-5 h-5 mr-1" /> */}
                  <span>Copy & Open Reviews</span>
                  {/* <ExternalLink className="w-4 h-4 ml-1" /> */}
                </>
              )}
            </Button>
          </div>

          <p className="text-[11px] text-muted text-center mt-2">
            Review is copied to your clipboard so you can simply paste & submit on Google.
          </p>
        </div>
      )}
    </div>
  );
};
