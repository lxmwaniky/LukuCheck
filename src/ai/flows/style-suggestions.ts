// src/ai/flows/style-suggestions.ts
'use server';
/**
 * @fileOverview Provides style suggestions for an outfit based on an uploaded image.
 *
 * - getStyleSuggestions - A function that takes an outfit image and returns style suggestions.
 * - StyleSuggestionsInput - The input type for the getStyleSuggestions function.
 * - StyleSuggestionsOutput - The return type for the getStyleSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StyleSuggestionsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the outfit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type StyleSuggestionsInput = z.infer<typeof StyleSuggestionsInputSchema>;

const StyleSuggestionsOutputSchema = z.object({
  colorSuggestions: z.array(z.string()).describe('List of color suggestions to enhance the outfit.'),
  lookSuggestions: z.string().describe('Suggestions for overall look improvements.'),
  rating: z.number().describe('The outfit rating out of 10.'),
  complimentOrCritique: z.string().describe('A direct compliment if the outfit is good (e.g., rating 7+/10), or a brutal (but constructive) critique if it needs significant improvement (e.g., rating below 7/10).'),
});
export type StyleSuggestionsOutput = z.infer<typeof StyleSuggestionsOutputSchema>;

export async function getStyleSuggestions(input: StyleSuggestionsInput): Promise<StyleSuggestionsOutput> {
  return styleSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'styleSuggestionsPrompt',
  input: { schema: StyleSuggestionsInputSchema },
  output: { schema: StyleSuggestionsOutputSchema },
  prompt: `As a professional fashion consultant, evaluate the outfit in the provided image.

IMPORTANT: First verify if this appears to be:
- A real person's outfit photo
- A celebrity/model photo
- A mannequin/store display
Only provide style advice for real personal outfit photos. For others, focus feedback on "This appears to be a [celebrity/mannequin] photo. For personalized style advice, please submit a photo of your own outfit. Then give a score of 0/10 and no further suggestions."

For personal outfit photos, provide:
1. Rating: Score the outfit from 1-10 based on fit, color coordination, and overall style
2. Color Analysis: Suggest 2-3 colors that would enhance the outfit
3. Style Recommendations: Give specific, actionable suggestions to elevate the look
4. Final Assessment:
   - For ratings ≥7: Highlight the strongest elements with a specific compliment
   - For ratings <7: Provide constructive feedback focused on practical improvements

Keep feedback professional, specific and supportive while maintaining honesty.`
});

const styleSuggestionsFlow = ai.defineFlow(
  {
    name: 'styleSuggestionsFlow',
    inputSchema: StyleSuggestionsInputSchema,
    outputSchema: StyleSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
