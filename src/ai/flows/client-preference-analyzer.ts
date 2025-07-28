'use server';

/**
 * @fileOverview AI-powered tool to generate summarized insights for client preferences.
 *
 * - analyzeClientPreferences - A function that handles the client preferences analysis process.
 * - AnalyzeClientPreferencesInput - The input type for the analyzeClientPreferences function.
 * - AnalyzeClientPreferencesOutput - The return type for the analyzeClientPreferences function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeClientPreferencesInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  clientDetails: z.string().describe('All gathered records for a client including past projects, visit summaries, and any other relevant notes.'),
});
export type AnalyzeClientPreferencesInput = z.infer<typeof AnalyzeClientPreferencesInputSchema>;

const AnalyzeClientPreferencesOutputSchema = z.object({
  preferenceSummary: z.string().describe('A summarized insight of the client preferences.'),
});
export type AnalyzeClientPreferencesOutput = z.infer<typeof AnalyzeClientPreferencesOutputSchema>;

export async function analyzeClientPreferences(input: AnalyzeClientPreferencesInput): Promise<AnalyzeClientPreferencesOutput> {
  return analyzeClientPreferencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeClientPreferencesPrompt',
  input: {schema: AnalyzeClientPreferencesInputSchema},
  output: {schema: AnalyzeClientPreferencesOutputSchema},
  prompt: `You are an AI assistant designed to analyze client details and extract insightful summaries of their preferences.

  Analyze the following client details and provide a concise summary of the client's preferences, considering their past projects, visit summaries, and any other relevant notes.

  Client Name: {{{clientName}}}
  Client Details: {{{clientDetails}}}

  Summarized Preferences:`, // No Handlebars in strings.
});

const analyzeClientPreferencesFlow = ai.defineFlow(
  {
    name: 'analyzeClientPreferencesFlow',
    inputSchema: AnalyzeClientPreferencesInputSchema,
    outputSchema: AnalyzeClientPreferencesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
