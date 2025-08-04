
"use server";

import { z } from "zod";
import { addClient, addProject, addVisit, addPhotoToVisit, getCurrentProfile } from "./data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Visit, UserProfile } from "./definitions";
import { createSupabaseAdminClient } from "./supabaseClient";


export async function getProfiles(): Promise<UserProfile[]> {
    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) return [];

    const profile = await getCurrentProfile();
    if (!profile) return [];
    
    let query;

    if (profile.email === 'mauriciodionizio@gmail.com') {
         query = supabaseAdmin.from('profiles').select('*, companies(name)');
    } else {
        query = supabaseAdmin.from('profiles').select('*, companies(name)').eq('company_id', profile.companyId);
    }

    const { data: profiles, error } = await query;
    
    if (error) {
        console.error("Error fetching profiles:", error);
        return [];
    }

    const userIds = profiles.map(p => p.id);
    if (userIds.length === 0) return [];
    
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000, 
    });
    
    if (usersError) {
        console.error("Error fetching auth users:", usersError);
        return [];
    }

    const emailMap = new Map(usersData.users.map(u => [u.id, u.email]));

    return profiles.map(p => ({
        id: p.id,
        fullName: p.full_name,
        status: p.status,
        role: p.role,
        companyId: p.company_id,
        email: emailMap.get(p.id) || 'N/A',
        companyName: (p.companies as any)?.name || 'N/A',
    }));
};


const clientSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  email: z.string().email("E-mail inválido.").optional(),
  phone: z.string().min(10, "Telefone inválido."),
  address: z.string().min(5, "Endereço inválido."),
  preferences: z.string().optional(),
});

export async function createClientAction(prevState: any, formData: FormData) {
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
    await addClient(validatedFields.data as any);
    revalidatePath('/clients');
    return { success: true };
  } catch (error) {
    return { message: "Erro de servidor ao validar cliente.", success: false };
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
        await addProject(validatedFields.data as any);
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
    const data = Object.fromEntries(formData.entries());
    const validatedFields = visitSchema.safeParse(data);

    if(!validatedFields.success) {
        console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
        throw new Error("Validação falhou");
    }
    
    const newVisit = await addVisit(validatedFields.data as any);
    revalidatePath(`/clients/${validatedFields.data.clientId}`);
    revalidatePath('/visits');
    return newVisit;
}


const photoSchema = z.object({
    visitId: z.string(),
    url: z.string().min(1, "Por favor, capture ou envie uma imagem."),
    description: z.string().min(3, "Descrição é obrigatória."),
    type: z.string(),
})

export async function addPhotoAction(prevState: any, formData: FormData) {
    const validatedFields = photoSchema.safeParse(Object.fromEntries(formData.entries()));
    
    if(!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'A validação falhou. Verifique os campos.',
        }
    }
    
    try {
        await addPhotoToVisit(validatedFields.data);
        revalidatePath(`/visits/${validatedFields.data.visitId}`);
        return { success: true, message: 'Foto adicionada com sucesso.', errors: {} }
    } catch(e) {
        return { success: false, message: 'Erro de servidor ao adicionar foto.', errors: {} }
    }
}
