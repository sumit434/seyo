import { GoogleGenAI } from '@google/genai';
import { db, IReviewLog } from '../config/db.js';
import { generateSecureKey } from '../utils/crypto.js';
import { getBusinessById } from './businessService.js';
import { getCustomerById } from './customerService.js';

export async function generateAIReviewSuggestions(
  businessName: string,
  category: string,
  rating: number,
  tags: string[],
  note?: string
): Promise<string[]> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const prompt = `You are an authentic, enthusiastic customer writing a brief 5-star Google review for "${businessName}" (${category}).
Tags mentioned by customer: ${tags.join(', ') || 'exceptional quality, warm hospitality'}.
Customer personal note: ${note || 'None'}.
Please output exactly 3 distinct, natural, human-sounding review drafts (1 to 2 sentences each) separated by "---".
Do not include quotation marks or meta-commentary. Keep them friendly and credible.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const parts = text
        .split('---')
        .map(p => p.trim())
        .filter(p => p.length > 10);

      if (parts.length > 0) {
        return parts.slice(0, 3);
      }
    } catch {
      // Fallback to contextual generator if AI API times out or fails
    }
  }

  // High-fidelity natural fallback templates
  const tagList = tags.length > 0 ? tags.join(' and ') : 'the phenomenal service';
  const customNoteAddition = note?.trim() ? ` ${note.trim()}` : '';

  return [
    `Had a fantastic experience at ${businessName}! Loved ${tagList}. Highly recommend to anyone visiting!${customNoteAddition}`,
    `Outstanding visit! The atmosphere was welcoming and ${tagList} truly stood out. Will definitely be returning regularly.${customNoteAddition}`,
    `Five stars all the way for ${businessName}. Everything from ${tagList} was top notch. A genuine neighborhood gem!${customNoteAddition}`,
  ];
}

export function persistReview(
  businessId: string,
  customerId: string,
  reviewText: string,
  rating = 5,
  tags: string[] = []
): { success: boolean; statusCode: number; message: string; reviewLog?: IReviewLog; googleReviewUrl?: string } {
  const business = getBusinessById(businessId);
  if (!business) {
    return { success: false, statusCode: 404, message: 'Business not found' };
  }

  const customer = getCustomerById(businessId, customerId);
  if (!customer) {
    return { success: false, statusCode: 404, message: 'Customer not found' };
  }

  const reviewLog: IReviewLog = {
    id: `rev_${generateSecureKey(8)}`,
    businessId,
    customerId,
    reviewText: reviewText.trim(),
    rating,
    tags,
    createdAt: new Date().toISOString(),
    googleReviewOpenedAt: null,
    status: 'persisted',
  };

  db.reviewLogs.set(reviewLog.id, reviewLog);

  // Authoritatively update customer review completion status
  customer.reviewJourneyCompleted = true;
  customer.reviewJourneyCompletedAt = new Date().toISOString();

  db.saveToDisk();

  return {
    success: true,
    statusCode: 200,
    message: 'Review record securely persisted before Google handoff.',
    reviewLog,
    googleReviewUrl: business.googleReviewUrl,
  };
}

export function logGoogleOpened(reviewId: string) {
  const log = db.reviewLogs.get(reviewId);
  if (log) {
    log.googleReviewOpenedAt = new Date().toISOString();
    log.status = 'google_opened';
    db.saveToDisk();
  }
}
