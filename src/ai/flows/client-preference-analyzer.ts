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
  prompt: `Você é um assistente de IA projetado para analisar detalhes de clientes e extrair resumos perspicazes de suas preferências.
  Seu resultado deve ser sempre no idioma Português do Brasil.

  Analise os seguintes detalhes do cliente e forneça um resumo conciso das preferências do cliente, considerando seus projetos anteriores, resumos de visitas e quaisquer outras notas relevantes.

  Nome do Cliente: {{{clientName}}}
  Detalhes do Cliente: {{{clientDetails}}}

  Preferências Resumidas:`, // No Handlebars in strings.
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
