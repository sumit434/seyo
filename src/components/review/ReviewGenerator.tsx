import React, { useState } from 'react';
import { Star, Copy, Check, ExternalLink, ThumbsUp } from 'lucide-react';
import { Button } from '../common/Button';
import { customerService } from '../../services/customerService';
import { copyToClipboard } from '../../utils/clipboard';

interface ReviewGeneratorProps {
  businessId: string;
  businessName: string;
  customerId: string;
  customerName: string;
  googleReviewUrl: string;
  onReviewCompleted: () => void;
}

const DEFAULT_TAGS = [
  'Amazing Service',
  'Exceptional Quality',
  'Friendly & Welcoming',
  'Great Atmosphere',
  'Quick & Attentive',
  'Clean & Cozy',
  'Highly Recommended',
];

export const ReviewGenerator: React.FC<ReviewGeneratorProps> = ({
  businessId,
  businessName,
  customerId,
  customerName,
  googleReviewUrl,
  onReviewCompleted,
}) => {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Amazing Service', 'Exceptional Quality']);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate review text dynamically
  const generateText = (stars: number, tags: string[]) => {
    const praise = stars === 5 ? 'Had an absolutely incredible experience at' : 'Had a great visit to';
    const tagPhrase = tags.length > 0 ? ` What stood out most was the ${tags.join(', ').toLowerCase()}.` : '';
    return `${praise} ${businessName}!${tagPhrase} Staff went above and beyond. Will definitely be recommending to friends and coming back soon!`;
  };

  const [reviewText, setReviewText] = useState(generateText(rating, selectedTags));

  const handleTagToggle = (tag: string) => {
    let next: string[];
    if (selectedTags.includes(tag)) {
      next = selectedTags.filter(t => t !== tag);
    } else {
      next = [...selectedTags, tag];
    }
    setSelectedTags(next);
    setReviewText(generateText(rating, next));
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    setReviewText(generateText(newRating, selectedTags));
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(reviewText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleProceedToGoogle = async () => {
    setIsSubmitting(true);
    setError(null);

    // On iPhone Safari, window.open after an async operation is blocked by Safari's popup blocker.
    // Pre-opening a reference allows setting location.href after the async persistence.
    let popupWindow: Window | null = null;
    try {
      popupWindow = window.open('about:blank', '_blank');
    } catch {
      // Ignored if browser blocks pre-opening
    }

    try {
      // 1. Copy review text to clipboard with Safari fallback
      await copyToClipboard(reviewText);
      setCopied(true);

      // 2. Mandatory server-side persistence BEFORE redirecting
      const res = await customerService.persistReview(
        businessId,
        customerId,
        rating,
        selectedTags,
        reviewText
      );

      // 3. Open Google review link
      const fallbackUrl = `https://maps.google.com/?q=${encodeURIComponent(businessName.replace(/\s+/g, '+'))}`;
      const targetUrl = res.googleReviewUrl || googleReviewUrl || fallbackUrl;

      if (popupWindow && !popupWindow.closed) {
        popupWindow.location.href = targetUrl;
      } else {
        try {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        } catch {
          window.location.href = targetUrl;
        }
      }

      // 4. Mark google opened and complete review journey
      await customerService.markGoogleOpened(res.reviewLogId, customerId);

      onReviewCompleted();
    } catch (err: any) {
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-3xl border border-[#e2e7e6] shadow-xl p-6 sm:p-8 text-left space-y-5">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e2f1ec] text-[#0e7c66] text-xs font-bold uppercase tracking-wider mb-2">
          <Star className="w-3.5 h-3.5 fill-[#0e7c66]" />
          <span>Verified Review</span>
        </div>
        <h2 className="text-2xl font-black text-[#10181c] tracking-tight">Share Your Experience</h2>
        <p className="text-xs text-[#6a787e] mt-1">
          Help others discover {businessName} on Google Maps!
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Star Rating */}
      <div className="flex flex-col items-center gap-2 bg-[#f1f3f2]/60 p-4 rounded-2xl border border-[#e2e7e6]">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(star)}
              className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-[#e2e7e6] hover:text-amber-300'
                }`}
              />
            </button>
          ))}
        </div>
        <span className="text-xs font-bold text-[#10181c]">
          {rating === 5 ? '⭐⭐⭐⭐⭐ Exceptional (5 Stars)' : `${rating} Stars`}
        </span>
      </div>

      {/* Sentiment Tags */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-[#6a787e] flex items-center gap-1.5">
          <ThumbsUp className="w-3.5 h-3.5 text-[#0e7c66]" />
          <span>Highlight What You Loved</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_TAGS.map(tag => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0e7c66] text-white shadow-xs'
                    : 'bg-[#f1f3f2] text-[#6a787e] hover:bg-[#e2e7e6]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Review Text Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-[#6a787e]">
            Review Draft
          </label>
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs text-[#0e7c66] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>
        </div>
        <textarea
          rows={3}
          value={reviewText}
          onChange={e => setReviewText(e.target.value)}
          className="w-full text-xs text-[#10181c] bg-[#f8faf9] p-3 rounded-2xl border border-[#e2e7e6] focus:outline-none focus:ring-2 focus:ring-[#0e7c66] leading-relaxed resize-none"
        />
      </div>

      {/* Action Button */}
      <div className="space-y-2 pt-1">
        <Button
          onClick={handleProceedToGoogle}
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          className="gap-2 shadow-lg"
        >
          <span>Copy & Open Google Review</span>
          <ExternalLink className="w-4 h-4" />
        </Button>
        <p className="text-[11px] text-center text-[#6a787e]">
          Your feedback is securely recorded on SEYO before redirecting.
        </p>
      </div>
    </div>
  );
};
