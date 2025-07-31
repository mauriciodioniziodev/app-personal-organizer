
'use server';

/**
 * @fileOverview Flow to notify the admin about a new user registration.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ADMIN_EMAIL = 'mauriciodionizio@gmail.com';

const NewUserInputSchema = z.object({
  userName: z.string().describe('The full name of the new user who registered.'),
});
export type NewUserInput = z.infer<typeof NewUserInputSchema>;

const EmailNotificationOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was sent successfully.'),
  message: z.string().describe('A confirmation or error message.'),
});
export type EmailNotificationOutput = z.infer<typeof EmailNotificationOutputSchema>;


export async function notifyAdminOfNewUser(input: NewUserInput): Promise<EmailNotificationOutput> {
  return emailNotificationFlow(input);
}


const emailPrompt = ai.definePrompt({
    name: 'newUserEmailPrompt',
    input: { schema: NewUserInputSchema },
    prompt: `
      Subject: Novo Cadastro no Sistema - Ação Necessária

      Olá,

      Um novo usuário acabou de se cadastrar no sistema de gerenciamento.

      Nome do Usuário: {{{userName}}}

      Por favor, acesse a seção "Administração" > "Gerenciamento de Usuários" para revisar o cadastro e autorizar ou revogar o acesso.

      Atenciosamente,
      Seu Sistema de Gestão Amanda Martins
    `,
});

const emailNotificationFlow = ai.defineFlow(
  {
    name: 'emailNotificationFlow',
    inputSchema: NewUserInputSchema,
    outputSchema: EmailNotificationOutputSchema,
  },
  async (input) => {
    // In a real application, this would use an email sending service (e.g., SendGrid, Mailgun).
    // Genkit doesn't have a native email tool, so we simulate the process.
    // We will generate the email content and log it to the console.
    
    console.log(`--- SIMULATING EMAIL NOTIFICATION ---`);
    console.log(`To: ${ADMIN_EMAIL}`);
    
    const response = await emailPrompt(input);
    const emailContent = response.text;

    console.log(emailContent);
    console.log(`------------------------------------`);

    // Here, you would add the actual email sending logic.
    // For now, we'll just return a success message assuming it worked.
    
    return {
      success: true,
      message: `Email content for ${ADMIN_EMAIL} generated and logged.`,
    };
  }
);
