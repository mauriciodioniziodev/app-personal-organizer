
'use server';
import {genkit, type GenkitError} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export async function isGenkitError(error: any): Promise<error is GenkitError> {
  return (
    error instanceof Error &&
    '__isGenkitError' in error &&
    error.__isGenkitError === true
  );
}
