"use server";

import { z } from "zod";
import { addClient, addProject, addVisit, addPhoto } from "./data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    };
  }
  
  try {
    addClient(validatedFields.data);
  } catch (error) {
    return { message: "Erro ao criar cliente." };
  }

  revalidatePath("/clients");
  revalidatePath("/projects/new");
  redirect("/clients");
}

const projectSchema = z.object({
    clientId: z.string().min(1, "Cliente é obrigatório."),
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
    redirect('/projects');
}

const visitSchema = z.object({
    projectId: z.string(),
    date: z.string().min(1, "Data é obrigatória."),
    summary: z.string().min(3, "Resumo é obrigatório."),
    status: z.string(),
});

export async function createVisit(prevState: any, formData: FormData) {
    const validatedFields = visitSchema.safeParse(Object.fromEntries(formData.entries()));

    if(!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }
    
    try {
        addVisit(validatedFields.data);
        revalidatePath(`/projects/${validatedFields.data.projectId}`);
        revalidatePath('/visits');
        return { message: 'Visita adicionada com sucesso.' }
    } catch(e) {
        return { message: 'Erro ao adicionar visita.'}
    }
}

const photoSchema = z.object({
    projectId: z.string(),
    url: z.string().url("URL inválida."),
    description: z.string().min(3, "Descrição é obrigatória."),
    type: z.string(),
})

export async function createPhoto(prevState: any, formData: FormData) {
    const validatedFields = photoSchema.safeParse(Object.fromEntries(formData.entries()));

    if(!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }
    
    try {
        addPhoto(validatedFields.data);
        revalidatePath(`/projects/${validatedFields.data.projectId}`);
        return { message: 'Foto adicionada com sucesso.' }
    } catch(e) {
        return { message: 'Erro ao adicionar foto.'}
    }
}
