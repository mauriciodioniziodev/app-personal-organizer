
'use server';
import {ai} from '@/ai/genkit';
import type {Client, Project, Visit} from '@/lib/definitions';
import {z, type ZodError} from 'genkit/zod';
import type {GenkitError} from 'genkit';

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

export const ServiceRecommenderInputSchema = z.object({
  client: z.custom<Client>(),
  projects: z.array(z.custom<Project>()),
  visits: z.array(z.custom<Visit>()),
});

export const ServiceRecommenderOutputSchema = z.object({
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
    return await serviceRecommenderFlow(input);
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

const recommendationPrompt = ai.definePrompt(
  {
    name: 'serviceRecommenderPrompt',
    input: {schema: ServiceRecommenderInputSchema},
    output: {schema: ServiceRecommenderOutputSchema},
    model: 'gemini-pro',
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

const serviceRecommenderFlow = ai.defineFlow(
  {
    name: 'serviceRecommenderFlow',
    inputSchema: ServiceRecommenderInputSchema,
    outputSchema: ServiceRecommenderOutputSchema,
  },
  async (input) => {
    const {output} = await recommendationPrompt(input);
    return output!;
  }
);
