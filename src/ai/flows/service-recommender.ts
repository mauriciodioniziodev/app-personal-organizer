
'use server';

/**
 * @fileOverview AI flow to recommend services based on client profile and project history.
 *
 * - recommendServices - A function that generates service recommendations.
 * - ServiceRecommendationInput - The input type for the recommendServices function.
 * - ServiceRecommendationOutput - The return type for the recommendServices function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ServiceRecommendationInputSchema = z.object({
  clientProfile: z.string().describe("The profile of the current client, including name, contact info, and preferences."),
  clientHistory: z.string().describe("A summary of past projects and interactions with this client."),
  pastProjectsContext: z.string().describe("A list of past projects for OTHER clients, to be used as a knowledge base for finding patterns.")
});
export type ServiceRecommendationInput = z.infer<typeof ServiceRecommendationInputSchema>;

const ServiceRecommendationOutputSchema = z.object({
  recommendations: z.array(z.object({
    serviceName: z.string().describe("The name of the recommended service or product (e.g., 'Organização de Closet', 'Pacote de Manutenção Mensal')."),
    justification: z.string().describe("A brief, compelling reason why this service is a good fit for this specific client, based on their profile and history."),
  })).describe("A list of up to 3 service or product recommendations."),
});
export type ServiceRecommendationOutput = z.infer<typeof ServiceRecommendationOutputSchema>;


export async function recommendServices(input: ServiceRecommendationInput): Promise<ServiceRecommendationOutput> {
  return serviceRecommenderFlow(input);
}


const recommendationPrompt = ai.definePrompt({
  name: 'serviceRecommenderPrompt',
  input: {schema: ServiceRecommendationInputSchema},
  output: {schema: ServiceRecommendationOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  prompt: `
    Você é um assistente de vendas especialista para um Personal Organizer. Sua tarefa é analisar o perfil de um cliente e o histórico de projetos da empresa para sugerir serviços adicionais (upsell).

    Seu idioma de resposta deve ser sempre Português do Brasil.

    Analise as informações a seguir:

    ## Perfil do Cliente Alvo:
    {{{clientProfile}}}

    ## Histórico do Cliente Alvo:
    {{{clientHistory}}}

    ## Base de Conhecimento (Projetos de outros clientes):
    {{{pastProjectsContext}}}


    ## Sua Tarefa:
    1.  Compare o "Perfil do Cliente Alvo" e seu "Histórico" com a "Base de Conhecimento".
    2.  Identifique padrões e oportunidades. Por exemplo, se clientes com cozinhas organizadas depois pediram para organizar a despensa, e o cliente alvo já organizou a cozinha, sugira a organização da despensa.
    3.  Gere uma lista de até 3 recomendações de serviços ou produtos.
    4.  Para cada recomendação, forneça uma justificativa curta e convincente, explicando por que ela é relevante para o cliente alvo.
  `,
});


const serviceRecommenderFlow = ai.defineFlow(
  {
    name: 'serviceRecommenderFlow',
    inputSchema: ServiceRecommendationInputSchema,
    outputSchema: ServiceRecommendationOutputSchema,
  },
  async (input) => {
    const {output} = await recommendationPrompt(input);
    return output!;
  }
);
