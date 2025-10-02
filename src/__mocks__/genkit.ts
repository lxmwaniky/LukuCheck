/**
 * Genkit AI Mocks
 * 
 * This file provides mock implementations for AI-powered functions
 * used in the application. These mocks allow testing without making
 * actual API calls to Google's Gemini AI or other AI services.
 */

import { vi } from 'vitest';
import type { StyleSuggestionsOutput } from '@/ai/flows/style-suggestions';

// ============================================================================
// MOCK AI RESPONSES
// ============================================================================

/**
 * Default mock style suggestions response
 * This mimics the output from the Gemini AI model
 */
export const createMockStyleSuggestions = (overrides: Partial<StyleSuggestionsOutput> = {}): StyleSuggestionsOutput => ({
  isActualUserOutfit: true,
  validityCritique: undefined,
  rating: 7.5,
  complimentOrCritique: 'Great color coordination! The outfit has a nice balance between casual and put-together.',
  colorSuggestions: [
    'Try adding a navy blue accessory to complement the existing colors',
    'Consider incorporating earth tones for a more grounded look'
  ],
  lookSuggestions: 'This outfit would be perfect for a casual day out or a relaxed office environment. Consider adding a light jacket for cooler weather.',
  ...overrides,
});

/**
 * Mock high-rated outfit response (9-10 rating)
 */
export const createMockHighRatedOutfit = (): StyleSuggestionsOutput => ({
  isActualUserOutfit: true,
  validityCritique: undefined,
  rating: 9.5,
  complimentOrCritique: 'Exceptional style! The color palette is sophisticated and the fit is impeccable. This outfit demonstrates excellent fashion sense.',
  colorSuggestions: [
    'The current color scheme is already excellent',
    'You could experiment with a bold accent color for variety'
  ],
  lookSuggestions: 'This is a versatile outfit suitable for professional settings, upscale casual events, or even a nice dinner. The styling is on point!',
});

/**
 * Mock low-rated outfit response (1-4 rating)
 */
export const createMockLowRatedOutfit = (): StyleSuggestionsOutput => ({
  isActualUserOutfit: true,
  validityCritique: undefined,
  rating: 3.0,
  complimentOrCritique: 'The outfit needs some work. The colors clash and the fit could be improved. Consider revisiting your color choices.',
  colorSuggestions: [
    'Replace the bright orange with a more neutral tone',
    'Try monochromatic colors for a cleaner look',
    'Avoid mixing too many patterns'
  ],
  lookSuggestions: 'This outfit would benefit from simplification. Start with neutral basics and add one statement piece. Consider getting items tailored for better fit.',
});

/**
 * Mock medium-rated outfit response (5-7 rating)
 */
export const createMockMediumRatedOutfit = (): StyleSuggestionsOutput => ({
  isActualUserOutfit: true,
  validityCritique: undefined,
  rating: 6.0,
  complimentOrCritique: 'Decent outfit with room for improvement. The basics are there, but some refinement would elevate the look.',
  colorSuggestions: [
    'Add a complementary color to create more visual interest',
    'Consider darker shades for a more polished appearance'
  ],
  lookSuggestions: 'This is a solid everyday outfit. To take it to the next level, focus on fit and add one or two accessories. Perfect for casual outings.',
});

/**
 * Mock perfect score outfit (10/10)
 */
export const createMockPerfectScoreOutfit = (): StyleSuggestionsOutput => ({
  isActualUserOutfit: true,
  validityCritique: undefined,
  rating: 10.0,
  complimentOrCritique: 'Absolutely flawless! This outfit is a masterclass in style. Everything from the color coordination to the fit is perfect.',
  colorSuggestions: [
    'This color palette is already perfect',
    'No changes needed - you\'ve nailed it!'
  ],
  lookSuggestions: 'This outfit is runway-ready! It\'s suitable for any occasion and showcases exceptional fashion sense. Keep doing what you\'re doing!',
});

/**
 * Mock invalid outfit response (not actual user outfit)
 * For cases like celebrity photos, mannequins, illustrations, etc.
 */
export const createMockInvalidOutfit = (reason: string = 'This appears to be a celebrity or stock photo.'): StyleSuggestionsOutput => ({
  isActualUserOutfit: false,
  validityCritique: reason,
  rating: 1.0,
  complimentOrCritique: 'This image cannot be properly rated as it does not appear to be an actual user outfit.',
  colorSuggestions: ['Please submit a photo of yourself wearing an outfit'],
  lookSuggestions: 'For a fair rating, please upload a photo of you wearing the outfit.',
});

// ============================================================================
// MOCK AI FUNCTIONS
// ============================================================================

/**
 * Mock getStyleSuggestions function
 * This is the main AI function that analyzes outfit photos
 * 
 * @param photoDataUri - Base64 encoded image data
 * @returns Style suggestions with rating and feedback
 */
export const getStyleSuggestions = vi.fn(async ({ photoDataUri }: { photoDataUri: string }): Promise<StyleSuggestionsOutput> => {
  // Simulate network delay (50-200ms)
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
  
  // Return default mock response
  return createMockStyleSuggestions();
});

/**
 * Mock AI error scenarios
 */
export const mockAIError = (errorMessage: string = 'AI processing failed') => {
  getStyleSuggestions.mockRejectedValueOnce(new Error(errorMessage));
};

/**
 * Mock AI rate limit error
 */
export const mockAIRateLimitError = () => {
  getStyleSuggestions.mockRejectedValueOnce(
    new Error('Rate limit exceeded. Please try again later.')
  );
};

/**
 * Mock AI invalid image error
 */
export const mockAIInvalidImageError = () => {
  getStyleSuggestions.mockRejectedValueOnce(
    new Error('Invalid image format. Please upload a valid image.')
  );
};

/**
 * Mock AI timeout error
 */
export const mockAITimeoutError = () => {
  getStyleSuggestions.mockRejectedValueOnce(
    new Error('Request timeout. The AI service took too long to respond.')
  );
};

// ============================================================================
// MOCK AI RESPONSE HELPERS
// ============================================================================

/**
 * Configure mock to return specific rating
 */
export const mockAIWithRating = (rating: number) => {
  let complimentOrCritique: string;
  let colorSuggestions: string[];
  let lookSuggestions: string;
  
  if (rating >= 9) {
    complimentOrCritique = 'Exceptional style! This outfit is outstanding.';
    colorSuggestions = ['The current colors are perfect', 'No changes needed'];
    lookSuggestions = 'This outfit is suitable for any upscale occasion.';
  } else if (rating >= 7) {
    complimentOrCritique = 'Great outfit! Well coordinated and stylish.';
    colorSuggestions = ['Try adding a complementary accent', 'Consider darker tones'];
    lookSuggestions = 'Perfect for casual or semi-formal settings.';
  } else if (rating >= 5) {
    complimentOrCritique = 'Decent outfit with potential for improvement.';
    colorSuggestions = ['Add more color variety', 'Consider neutral tones'];
    lookSuggestions = 'Good for everyday wear, could be elevated with accessories.';
  } else {
    complimentOrCritique = 'The outfit needs significant improvement.';
    colorSuggestions = ['Simplify the color palette', 'Avoid clashing colors', 'Start with neutrals'];
    lookSuggestions = 'Focus on basics and proper fit before adding complexity.';
  }
  
  getStyleSuggestions.mockResolvedValueOnce({
    isActualUserOutfit: true,
    validityCritique: undefined,
    rating,
    complimentOrCritique,
    colorSuggestions,
    lookSuggestions,
  });
};

/**
 * Configure mock to return multiple different responses in sequence
 */
export const mockAIWithSequence = (responses: StyleSuggestionsOutput[]) => {
  responses.forEach(response => {
    getStyleSuggestions.mockResolvedValueOnce(response);
  });
};

/**
 * Configure mock to always return the same response
 */
export const mockAIWithFixedResponse = (response: StyleSuggestionsOutput) => {
  getStyleSuggestions.mockResolvedValue(response);
};

// ============================================================================
// HELPER FUNCTIONS FOR TESTS
// ============================================================================

/**
 * Reset all AI mocks
 */
export const resetAIMocks = () => {
  getStyleSuggestions.mockClear();
  getStyleSuggestions.mockReset();
  
  // Reset to default behavior
  getStyleSuggestions.mockImplementation(async ({ photoDataUri }) => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return createMockStyleSuggestions();
  });
};

/**
 * Get the number of times AI was called
 */
export const getAICallCount = () => {
  return getStyleSuggestions.mock.calls.length;
};

/**
 * Get all AI call arguments
 */
export const getAICallArgs = () => {
  return getStyleSuggestions.mock.calls;
};

/**
 * Check if AI was called with specific photo data
 */
export const wasAICalledWithPhoto = (photoDataUri: string) => {
  return getStyleSuggestions.mock.calls.some(
    call => call[0]?.photoDataUri === photoDataUri
  );
};

// ============================================================================
// USAGE TRACKING MOCKS (for AI usage limits)
// ============================================================================

/**
 * Mock AI usage tracking
 * Simulates the usage limit system
 */
export const createMockAIUsageTracker = () => {
  let usageCount = 0;
  const dailyLimit = 10;
  
  return {
    getUsageCount: vi.fn(() => usageCount),
    incrementUsage: vi.fn(() => {
      usageCount++;
      return usageCount;
    }),
    resetUsage: vi.fn(() => {
      usageCount = 0;
    }),
    hasReachedLimit: vi.fn(() => usageCount >= dailyLimit),
    getRemainingUsage: vi.fn(() => Math.max(0, dailyLimit - usageCount)),
  };
};

// ============================================================================
// EXPORT TYPES
// ============================================================================

/**
 * Re-export the StyleSuggestionsOutput type for convenience
 */
export type { StyleSuggestionsOutput };
