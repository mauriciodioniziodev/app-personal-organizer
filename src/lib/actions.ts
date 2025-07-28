"use server";

import { z } from "zod";
import { addClient, addProject, addVisit, addPhotoToVisit, getVisits } from "./data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Visit } from "./definitions";

const clientSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  email: z.string().email("E-mail inválido."),
  phone: z.string().min(10, "Telefone inválido."),
  address: z.string().min(5, "Endereço inválido."),
  preferences: z.string().optional(),
});

export async function createClient(prevState: any, formData: FormData) {
  const validatedFields = clientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    preferences: formData.get("preferences"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }
  
  try {
    const newClient = addClient(validatedFields.data);
    revalidatePath("/clients");
    revalidatePath("/projects/new");
    return { success: true, newClient };
  } catch (error) {
    return { message: "Erro ao criar cliente.", success: false };
  }
}

const projectSchema = z.object({
    clientId: z.string().min(1, "Cliente é obrigatório."),
    visitId: z.string().optional(),
    name: z.string().min(3, "O nome do projeto deve ter pelo menos 3 caracteres."),
    description: z.string().optional(),
    startDate: z.string().min(1, "Data de início é obrigatória."),
    endDate: z.string().min(1, "Data de conclusão é obrigatória."),
    value: z.coerce.number().min(0, "O valor deve ser positivo."),
    paymentStatus: z.string()
});

export async function createProject(prevState: any, formData: FormData) {
    const validatedFields = projectSchema.safeParse(Object.fromEntries(formData.entries()));

    if(!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    try {
        addProject(validatedFields.data);
    } catch (e) {
        return { message: 'Erro ao criar projeto.'}
    }

    revalidatePath('/projects');
    if (validatedFields.data.visitId) {
        revalidatePath(`/visits/${validatedFields.data.visitId}`);
    }
    redirect('/projects');
}

const visitSchema = z.object({
    clientId: z.string(),
    date: z.string().min(1, "Data é obrigatória."),
    summary: z.string().min(3, "Resumo é obrigatório."),
    status: z.string(),
});

export async function createVisit(formData: FormData): Promise<Visit> {
    const validatedFields = visitSchema.safeParse(Object.fromEntries(formData.entries()));

    if(!validatedFields.success) {
        throw new Error("Validação falhou");
    }
    
    const newVisit = addVisit(validatedFields.data);
    revalidatePath(`/clients/${validatedFields.data.clientId}`);
    revalidatePath('/visits');
    return newVisit;
}


const photoSchema = z.object({
    visitId: z.string(),
    url: z.string().min(1, "URL da imagem ou captura da câmera é obrigatória."), // Can be data URL
    description: z.string().min(3, "Descrição é obrigatória."),
    type: z.string(), // 'upload' or 'camera'
})

export async function addPhotoAction(formData: FormData) {
    const validatedFields = photoSchema.safeParse(Object.fromEntries(formData.entries()));

    if(!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }
    
    try {
        addPhotoToVisit(validatedFields.data);
        revalidatePath(`/visits/${validatedFields.data.visitId}`);
        return { message: 'Foto adicionada com sucesso.' }
    } catch(e) {
        return { message: 'Erro ao adicionar foto.'}
    }
}
