
'use server';
import {ai} from '@/ai/genkit';
import type {Client, Project, Visit} from '@/lib/definitions';
import {z} from 'zod';
import type {GenkitError} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

function isGenkitError(error: any): error is GenkitError {
  return (
    error instanceof Error &&
    '__isGenkitError' in error &&
    error.__isGenkitError === true
  );
}

const ServiceRecommendationSchema = z.object({
  serviceName: z.string().describe('The name of the recommended service.'),
  justification: z
    .string()
    .describe(
      'A detailed justification for why this service is being recommended, based on the provided client data.'
    ),
  urgency: z
    .enum(['high', 'medium', 'low'])
    .describe(
      'The urgency of the recommendation (high, medium, or low).'
    ),
});

const ServiceRecommenderInputSchema = z.object({
  client: z.custom<Client>(),
  projects: z.array(z.custom<Project>()),
  visits: z.array(z.custom<Visit>()),
});

const ServiceRecommenderOutputSchema = z.object({
  recommendations: z
    .array(ServiceRecommendationSchema)
    .describe('A list of service recommendations for the client.'),
});

export type ServiceRecommenderInput = z.infer<
  typeof ServiceRecommenderInputSchema
>;
export type ServiceRecommenderOutput = z.infer<
  typeof ServiceRecommenderOutputSchema
>;

export async function recommendServices(
  input: ServiceRecommenderInput
): Promise<ServiceRecommenderOutput> {
  try {
    const recommendationPrompt = ai.definePrompt(
      {
        name: 'serviceRecommenderPrompt',
        model: 'gemini-pro',
        input: {schema: ServiceRecommenderInputSchema},
        output: {schema: ServiceRecommenderOutputSchema},
        prompt: `
        You are an expert Personal Organizer consultant.
        Based on the client's profile, past projects, and visit history, please recommend new services.
        For each recommendation, provide a clear justification and an urgency level.

        Client Profile:
        - Name: {{{client.name}}}
        - Preferences & Notes: {{{client.preferences}}}

        Past Projects:
        {{#each projects}}
        - Project: {{{this.name}}}
          - Description: {{{this.description}}}
          - Status: {{{this.status}}}
        {{/each}}

        Visit History:
        {{#each visits}}
        - Visit Date: {{{this.date}}}
          - Summary: {{{this.summary}}}
          - Status: {{{this.status}}}
        {{/each}}
      `,
      },
    );

    const {output} = await recommendationPrompt(input);
    if (!output) {
      throw new Error('No output from AI service.');
    }
    return output;
  } catch (e) {
    if (isGenkitError(e)) {
      console.error(`Genkit Error (${e.code}): ${e.message}`);
    } else {
      console.error('An unexpected error occurred:', e);
    }
    // Re-throw the error to be caught by the client
    throw e;
  }
}
