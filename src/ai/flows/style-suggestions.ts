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
  isActualUserOutfit: z.boolean().describe('True if the photo shows a real person (likely the user) wearing the outfit. False if it\'s a celebrity, mannequin, illustration, stock photo, or a photo of another private individual without clear consent for this context.'),
  validityCritique: z.string().optional().describe('If not an actual user outfit, a brief explanation why. Otherwise, may be empty.'),
  colorSuggestions: z.array(z.string()).describe('List of color suggestions to enhance the outfit. Provide minimal or generic suggestions if not an actual user outfit or if validity is questionable.'),
  lookSuggestions: z.string().describe('Suggestions for overall look improvements. Provide minimal or generic suggestions if not an actual user outfit or if validity is questionable.'),
  rating: z.number().describe('The outfit rating out of 10. Assign a very low rating (e.g., 1-2) if not an actual user outfit or if validity is questionable due to privacy/consent concerns. For valid user outfits, use the full 0-10 scale appropriately.').min(0).max(10),
  complimentOrCritique: z.string().describe('A direct compliment if the outfit is good (e.g., rating 7+/10 and is a valid user outfit), or a brutal (but constructive) critique if it needs significant improvement or is invalid. Focus on validity and privacy first.'),
});
export type StyleSuggestionsOutput = z.infer<typeof StyleSuggestionsOutputSchema>;

export async function getStyleSuggestions(input: StyleSuggestionsInput): Promise<StyleSuggestionsOutput> {
  return styleSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'styleSuggestionsPrompt',
  input: {schema: StyleSuggestionsInputSchema},
  output: {schema: StyleSuggestionsOutputSchema},
  prompt: `You are a brutally honest but ultimately helpful personal stylist. Your primary goal is to make the user look their best, EVEN IF IT MEANS BEING VERY DIRECT. However, your ABSOLUTE FIRST PRIORITY is to ensure fair play in a style challenge AND to respect individual privacy.

**IMPORTANT VALIDATION STEP FIRST - PRIORITIZE THIS:**
Analyze the image to determine if it's a valid submission for a personal style challenge. A valid submission is a photo of THE USER THEMSELVES wearing an outfit.

- If the image features a celebrity (e.g., red carpet photo, professional photoshoot), a drawing/illustration, an outfit on a mannequin, a flat lay (clothes laid out flat), or appears to be a stock photo or advertisement, it is NOT a valid submission.
  Set \`isActualUserOutfit\` to \`false\`.
  Provide a \`validityCritique\` explaining why (e.g., "This appears to be a photo of a celebrity.", "Outfits on mannequins are not eligible.").
  Assign a very low \`rating\` (e.g., 1 or 2 out of 10).
  Set \`complimentOrCritique\` to reflect the validity issue (e.g., "This image cannot be properly rated as it features a mannequin.").
  Keep \`colorSuggestions\` and \`lookSuggestions\` minimal or generic (e.g., ["Focus on fit and personal style."]).

- **CRITICAL PRIVACY CHECK: If the photo appears to be of an identifiable private individual who is clearly NOT the user submitting the photo (e.g., a candid photo of a friend, family member, or stranger taken without their likely knowledge or consent for this type of public style challenge), this is a serious concern.**
  Set \`isActualUserOutfit\` to \`false\`.
  Provide a \`validityCritique\` such as: 'This photo appears to be of another private individual. For privacy and consent reasons, please only submit photos of yourself for style challenges, or ensure you have explicit permission from the person photographed for their image to be used in this way.'
  Assign a very low \`rating\` (e.g., 1 out of 10).
  Set \`complimentOrCritique\` to firmly state: "This photo cannot be rated due to privacy concerns regarding the use of an image of another individual. Please only submit photos of yourself."
  Keep \`colorSuggestions\` and \`lookSuggestions\` minimal or state they are not applicable due to the privacy issue.

If, AND ONLY IF, the image IS a valid submission (THE USER THEMSELVES wearing the outfit and not any of the invalid types above):
Set \`isActualUserOutfit\` to \`true\`.
Set \`validityCritique\` to an empty string or omit it.
Then proceed with the detailed style analysis:
1. Provide a \`rating\` out of 10. **For valid user outfit submissions, strive to use the full 0-10 rating scale. A rating of 5/10 should represent an average outfit with some good elements and some areas for improvement. Do not be afraid to give higher scores (e.g., 7-9) for well-put-together, stylish, and appropriate looks, and reserve 10/10 for truly exceptional, flawless, and inspiring outfits. Continue to be brutally honest for outfits that genuinely miss the mark (0-4), explaining why clearly.**
2. Suggest specific \`colorSuggestions\` that would complement or improve the outfit.
3. Suggest overall \`lookSuggestions\`.
4. Based on your rating and analysis, provide a \`complimentOrCritique\`:
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

