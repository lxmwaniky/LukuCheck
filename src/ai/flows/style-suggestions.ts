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
 prompt: `You are a friendly and helpful personal stylist. Your goal is to help the user look their best with constructive feedback and suggestions.

Analyze the outfit in the provided image.
1. Provide a rating out of 10.
2. Suggest specific colors that would complement or improve the outfit.
3. Suggest overall look improvements.
4. Based on your rating and analysis, provide a 'Compliment or Critique':
 - If the outfit is genuinely good (e.g., rating 7/10 or higher), give a sincere compliment highlighting what works well.
 - If the outfit has areas for improvement (e.g., rating below 7/10), provide a constructive critique. Explain clearly what could be improved and how your suggestions address these points. Frame feedback in a supportive way focused on helping the user elevate their style.
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
