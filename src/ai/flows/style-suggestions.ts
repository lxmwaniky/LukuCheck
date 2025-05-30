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
  input: {schema: StyleSuggestionsInputSchema},
  output: {schema: StyleSuggestionsOutputSchema},
  prompt: `You are a brutally honest but ultimately helpful personal stylist. Your goal is to make the user look their best, even if it means being very direct.

Analyze the outfit in the provided image.
1. Provide a rating out of 10.
2. Suggest specific colors that would complement or improve the outfit.
3. Suggest overall look improvements.
4. Based on your rating and analysis, provide a 'Compliment or Critique':
    - If the outfit is genuinely good (e.g., rating 7/10 or higher), give a sincere compliment highlighting what works.
    - If the outfit has issues (e.g., rating below 7/10), provide a direct, even "brutal" (but still constructive and actionable) critique. Don't hold back on what's wrong, but explain why and tie it to your suggestions for improvement. Avoid generic or overly soft language for critiques. The user wants to know the truth.

Image: {{media url=photoDataUri}}
  `,
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
