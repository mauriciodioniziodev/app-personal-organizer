

import type { Client, Project, Visit, Photo, VisitsSummary, ScheduleItem, Payment, MasterDataItem } from './definitions';
import { supabase } from './supabaseClient';


// --- Helper Functions ---
const getProjectPaymentStatus = (payments: Payment[] | undefined): string => {
    if (!payments || payments.length === 0) {
        return 'pendente';
    }
    const paidCount = payments.filter(p => p.status === 'pago').length;
    if (paidCount === 0) return 'pendente';
    if (paidCount === payments.length) return 'pago';
    return 'parcialmente pago';
}

// --- Data Access Functions ---

export const getClients = async (): Promise<Client[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (error) {
        console.error("Error fetching clients:", error);
        return [];
    }
    return data.map(c => ({
        id: c.id,
        created_at: c.created_at,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        preferences: c.preferences,
        cpf: c.cpf,
        birthday: c.birthday
    })) as Client[];
};
export const getClientById = async (id: string): Promise<Client | null> => {
    if (!supabase || !id) return null;
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
    if (error) {
        console.error(`Error fetching client ${id}:`, error);
        return null;
    }
    return data as Client;
};

export const getProjects = async (): Promise<Project[]> => {
    if (!supabase) return [];
    const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*').order('start_date', { ascending: false });
    if (projectsError) {
        console.error("Error fetching projects:", projectsError);
        return [];
    }

    const projectIds = projectsData.map(p => p.id);
    if(projectIds.length === 0) return [];
    
    const { data: paymentsData, error: paymentsError } = await supabase.from('payments').select('*').in('project_id', projectIds);
     if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
        // Still return projects, but they will have empty payments
        return projectsData.map(p => ({ ...p, payments: [], paymentStatus: 'pendente' } as Project));
    }

    return projectsData.map(p_raw => {
        const p = p_raw as any; // Allow snake_case access
        const payments = paymentsData
            .filter(payment => payment.project_id === p.id)
            .map(pay_raw => {
                 const pay = pay_raw as any;
                 return {
                    id: pay.id,
                    created_at: pay.created_at,
                    project_id: pay.project_id,
                    amount: pay.amount,
                    status: pay.status,
                    dueDate: pay.due_date.split('T')[0],
                    description: pay.description
                 } as Payment
            });

        return { 
            ...p,
            clientId: p.client_id,
            visitId: p.visit_id,
            startDate: p.start_date,
            endDate: p.end_date,
            discountPercentage: p.discount_percentage,
            discountAmount: p.discount_amount,
            finalValue: p.final_value,
            paymentMethod: p.payment_method,
            paymentInstrument: p.payment_instrument,
            photosBefore: p.photos_before,
            photosAfter: p.photos_after,
            payments: payments,
            paymentStatus: getProjectPaymentStatus(payments) 
        } as Project;
    });
};

export const getProjectById = async (id: string): Promise<Project | null> => {
    if (!supabase || !id) return null;
    const { data: projectData, error: projectError } = await supabase.from('projects').select('*').eq('id', id).single();
    if (projectError || !projectData) {
        console.error(`Error fetching project ${id}:`, projectError);
        return null;
    }

    const { data: paymentsData, error: paymentsError } = await supabase.from('payments').select('*').eq('project_id', id);
    if (paymentsError) {
        console.error(`Error fetching payments for project ${id}:`, paymentsError);
        // Return project data even if payments fail
        return { ...projectData, payments: [], paymentStatus: 'pendente' } as Project;
    }
    
    const p = projectData as any;
    const payments = paymentsData.map(pay_raw => {
        const pay = pay_raw as any;
        return {
           id: pay.id,
           created_at: pay.created_at,
           project_id: pay.project_id,
           amount: pay.amount,
           status: pay.status,
           dueDate: pay.due_date.split('T')[0],
           description: pay.description
        } as Payment
   });


    return { 
        ...p,
        clientId: p.client_id,
        visitId: p.visit_id,
        startDate: p.start_date,
        endDate: p.end_date,
        discountPercentage: p.discount_percentage,
        discountAmount: p.discount_amount,
        finalValue: p.final_value,
        paymentMethod: p.payment_method,
        paymentInstrument: p.payment_instrument,
        photosBefore: p.photos_before,
        photosAfter: p.photos_after,
        payments: payments as Payment[], 
        paymentStatus: getProjectPaymentStatus(payments as Payment[]) 
    } as Project;
};

export const getProjectsByClientId = async (clientId: string): Promise<Project[]> => {
    if (!supabase) return [];
    const projects = await getProjects();
    return projects.filter(p => p.clientId === clientId);
};

export const getVisits = async (): Promise<Visit[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('visits').select('*').order('date', { ascending: false });
    if (error) {
        console.error("Error fetching visits:", error);
        return [];
    }
    return data.map(v_raw => {
        const v = v_raw as any;
        return {
            id: v.id,
            created_at: v.created_at,
            clientId: v.client_id,
            projectId: v.project_id,
            date: v.date,
            status: v.status,
            summary: v.summary,
            photos: v.photos,
            budgetAmount: v.budget_amount,
            budgetPdfUrl: v.budget_pdf_url,
        } as Visit
    });
};
export const getVisitById = async (id: string): Promise<Visit | null> => {
    if (!supabase || !id) return null;
    const { data, error } = await supabase.from('visits').select('*').eq('id', id).single();
    if (error || !data) {
        console.error(`Error fetching visit ${id}:`, error);
        return null;
    }
    const v = data as any;
    return {
        id: v.id,
        created_at: v.created_at,
        clientId: v.client_id,
        projectId: v.project_id,
        date: v.date,
        status: v.status,
        summary: v.summary,
        photos: v.photos,
        budgetAmount: v.budget_amount,
        budgetPdfUrl: v.budget_pdf_url,
    } as Visit
};
export const getVisitsByClientId = async (clientId: string): Promise<Visit[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('visits').select('*').eq('client_id', clientId).order('date', { ascending: false });
     if (error) {
        console.error(`Error fetching visits for client ${clientId}:`, error);
        return [];
    }
    return data as Visit[];
};

// --- Dynamic Master Data Functions ---
// Fallback static data if the database is not connected or tables don't exist.
const STATIC_VISIT_STATUS: MasterDataItem[] = [
    { id: '1', name: 'pendente', created_at: new Date().toISOString() },
    { id: '2', name: 'realizada', created_at: new Date().toISOString() },
    { id: '3', name: 'cancelada', created_at: new Date().toISOString() },
    { id: '4', name: 'orçamento', created_at: new Date().toISOString() },
];

const STATIC_PAYMENT_INSTRUMENTS: MasterDataItem[] = [
    { id: '1', name: 'PIX', created_at: new Date().toISOString() },
    { id: '2', name: 'Cartão de Crédito', created_at: new Date().toISOString() },
    { id: '3', name: 'Dinheiro', created_at: new Date().toISOString() },
    { id: '4', name: 'Transferência Bancária', created_at: new Date().toISOString() },
];


export const getVisitStatusOptions = async (): Promise<MasterDataItem[]> => {
    if (!supabase) return STATIC_VISIT_STATUS;
    const { data, error } = await supabase.from('master_visit_status').select('*').order('name');
    if (error || !data || data.length === 0) {
        return STATIC_VISIT_STATUS;
    }
    return data as MasterDataItem[];
}
export const addVisitStatusOption = async (name: string): Promise<MasterDataItem> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabase.from('master_visit_status').insert([{ name }]).select().single();
    if (error) {
        console.error("Error adding visit status:", error);
        throw new Error("Falha ao adicionar status.");
    }
    return data as MasterDataItem;
}
export const deleteVisitStatusOption = async (id: string) => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { error } = await supabase.from('master_visit_status').delete().eq('id', id);
    if (error) {
        console.error("Error deleting visit status:", error);
        throw new Error("Falha ao remover status.");
    }
    return true;
}


export const getPaymentInstrumentsOptions = async (): Promise<MasterDataItem[]> => {
     if (!supabase) return STATIC_PAYMENT_INSTRUMENTS;
     const { data, error } = await supabase.from('master_payment_instruments').select('*').order('name');
     if (error || !data || data.length === 0) {
         return STATIC_PAYMENT_INSTRUMENTS;
     }
     return data as MasterDataItem[];
}
export const addPaymentInstrumentOption = async (name: string): Promise<MasterDataItem> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabase.from('master_payment_instruments').insert([{ name }]).select().single();
    if (error) {
        console.error("Error adding payment instrument:", error);
        throw new Error("Falha ao adicionar meio de pagamento.");
    }
    return data as MasterDataItem;
}
export const deletePaymentInstrumentOption = async (id: string) => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { error } = await supabase.from('master_payment_instruments').delete().eq('id', id);
    if (error) {
        console.error("Error deleting payment instrument:", error);
        throw new Error("Falha ao remover meio de pagamento.");
    }
    return true;
}


// --- Dashboard Functions ---
export const getTotalRevenue = async () => {
    if (!supabase) return 0;
    const { data, error } = await supabase.from('payments').select('amount').eq('status', 'pago');
    if (error) {
        console.error("Error fetching total revenue:", error);
        return 0;
    }
    return data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
};

export const getTotalPendingRevenue = async () => {
    if (!supabase) return 0;
    const { data, error } = await supabase.from('payments').select('amount').eq('status', 'pendente');
    if (error) {
        console.error("Error fetching pending revenue:", error);
        return 0;
    }
    return data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
};

export const getActiveProjects = async () => {
    if (!supabase) return [];
    const projects = await getProjects();
    return projects.filter(p => new Date(p.endDate) >= new Date() && p.paymentStatus !== 'pago');
}

export const getUpcomingVisits = async () => {
    if (!supabase) return [];
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const { data, error } = await supabase.from('visits')
        .select('*')
        .eq('status', 'pendente')
        .gte('date', now.toISOString())
        .lte('date', oneWeekFromNow.toISOString())
        .order('date', { ascending: true });

    if (error) {
        console.error("Error fetching upcoming visits:", error);
        return [];
    }
    return data as Visit[];
}
export const getVisitsSummary = async (): Promise<VisitsSummary> => {
    if (!supabase) return {};
    const { data, error } = await supabase.from('visits').select('status');
    if(error) {
        console.error("Error fetching visits summary:", error);
        return {};
    }
    return data.reduce((acc, visit) => {
        acc[visit.status] = (acc[visit.status] || 0) + 1;
        return acc;
    }, {} as VisitsSummary);
};

export const getTodaysSchedule = async (): Promise<ScheduleItem[]> => {
    if (!supabase) return [];
    const clients = await getClients();
    const getClient = (clientId: string) => clients.find(c => c.id === clientId);

    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data: todayVisits, error: visitsError } = await supabase.from('visits')
        .select('*')
        .gte('date', startOfDay.toISOString())
        .lte('date', endOfDay.toISOString());

    if(visitsError) {
        console.error("Error fetching today's visits:", visitsError);
        return [];
    }
    
    const { data: todayProjects, error: projectsError } = await supabase.from('projects')
        .select('*')
        .lte('start_date', endOfDay.toISOString().split('T')[0])
        .gte('end_date', startOfDay.toISOString().split('T')[0]);

    if(projectsError) {
        console.error("Error fetching today's projects:", projectsError);
        return [];
    }

    const schedule: ScheduleItem[] = [];

    todayVisits.forEach(v_raw => {
        const v = v_raw as any;
        const client = getClient(v.client_id);
        const visitDate = new Date(v.date);
        schedule.push({
            id: v.id,
            type: 'visit',
            date: v.date,
            time: visitDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            title: `Visita`,
            clientName: client?.name ?? 'Cliente desconhecido',
            clientId: v.client_id,
            clientPhone: client?.phone,
            clientAddress: client?.address,
            status: v.status,
            path: `/visits/${v.id}`,
            isOverdue: v.status === 'pendente' && now.getTime() > visitDate.getTime(),
        });
    });

    const projectIds = todayProjects.map(p => p.id);
    if (projectIds.length > 0) {
        const { data: paymentsData } = await supabase.from('payments').select('*').in('project_id', projectIds);
        
        todayProjects.forEach(p_raw => {
            const p = p_raw as any;
            const client = getClient(p.client_id);
            const payments = paymentsData?.filter(pm => pm.project_id === p.id) || [];
            schedule.push({
                id: p.id,
                type: 'project',
                date: p.start_date, // Using start date for sorting consistency
                title: p.name,
                clientName: client?.name ?? 'Cliente desconhecido',
                clientId: p.client_id,
                clientPhone: client?.phone,
                clientAddress: client?.address,
                projectStartDate: p.start_date,
                projectEndDate: p.end_date,
                status: getProjectPaymentStatus(payments as Payment[]),
                path: `/projects/${p.id}`
            });
        });
    }


    return schedule.sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);

        if (a.time && b.time) {
            return aDate.getTime() - bDate.getTime();
        }
        if (a.time) return -1; // Visits with time come first
        if (b.time) return 1;

        // If both are projects (no time), sort by start date
        const aStartDate = new Date(a.projectStartDate || a.date);
        const bStartDate = new Date(b.projectStartDate || b.date);
        return aStartDate.getTime() - bStartDate.getTime();
    });
};


// --- Data Mutation Functions (used by server actions) ---
export const addClient = async (client: Omit<Client, 'id' | 'created_at'>) => {
  if (!supabase) throw new Error("Supabase client is not initialized.");
  const { data, error } = await supabase.from('clients').insert([client]).select().single();
  if (error) {
      console.error("Error adding client:", error);
      throw new Error("Falha ao adicionar cliente.");
  }
  return data as Client;
};

export const addProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'payments' | 'photosBefore' | 'photosAfter' | 'paymentStatus'> & { payments: Omit<Payment, 'id' | 'created_at' | 'project_id'>[] }) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { payments: paymentsData, ...projectCoreData } = projectData;
    
    const dbProjectData = {
      client_id: projectCoreData.clientId,
      visit_id: projectCoreData.visitId,
      name: projectCoreData.name,
      description: projectCoreData.description,
      start_date: projectCoreData.startDate,
      end_date: projectCoreData.endDate,
      value: projectCoreData.value,
      discount_percentage: projectCoreData.discountPercentage,
      discount_amount: projectCoreData.discountAmount,
      final_value: projectCoreData.finalValue,
      payment_method: projectCoreData.paymentMethod,
      payment_instrument: projectCoreData.paymentInstrument,
      photos_before: [],
      photos_after: [],
    };


    // 1. Insert the project
    const { data: newProject, error: projectError } = await supabase.from('projects')
        .insert([dbProjectData])
        .select()
        .single();
    
    if (projectError) {
        console.error("Error creating project:", projectError);
        throw new Error("Falha ao criar projeto.");
    }

    // 2. Insert payments associated with the new project
    const paymentsToInsert = paymentsData.map(p => ({ ...p, project_id: newProject.id, due_date: p.dueDate }));
    const { error: paymentsError } = await supabase.from('payments').insert(paymentsToInsert);

    if (paymentsError) {
        console.error("Error creating payments:", paymentsError);
        // Optionally, delete the created project for consistency
        await supabase.from('projects').delete().eq('id', newProject.id);
        throw new Error("Falha ao salvar parcelas do projeto.");
    }
  
    // 3. If it came from a visit, update the visit
    if (projectData.visitId) {
        const { error: visitUpdateError } = await supabase.from('visits')
            .update({ project_id: newProject.id })
            .eq('id', projectData.visitId);
        if (visitUpdateError) {
            console.error("Error updating visit with project id:", visitUpdateError);
            // This is not a critical failure, so we can just log it
        }
    }

    return newProject;
};

export const updateProject = async (project: Omit<Project, 'paymentStatus'>) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { payments, photosBefore, photosAfter, ...coreProjectData } = project;
    
    const dbProjectData = {
        client_id: coreProjectData.clientId,
        visit_id: coreProjectData.visitId,
        name: coreProjectData.name,
        description: coreProjectData.description,
        start_date: coreProjectData.startDate,
        end_date: coreProjectData.endDate,
        value: coreProjectData.value,
        discount_percentage: coreProjectData.discountPercentage,
        discount_amount: coreProjectData.discountAmount,
        final_value: coreProjectData.finalValue,
        payment_method: coreProjectData.paymentMethod,
        payment_instrument: coreProjectData.paymentInstrument,
        photos_before: photosBefore,
        photos_after: photosAfter,
    };
    
    // 1. Update the core project data
    const { data: updatedProject, error: projectError } = await supabase.from('projects')
        .update(dbProjectData)
        .eq('id', project.id)
        .select()
        .single();

    if (projectError) {
        console.error("Error updating project:", projectError);
        throw new Error("Falha ao atualizar o projeto.");
    }

    // 2. Upsert payments (update existing, insert new)
    const paymentsToUpsert = payments.map(p => ({...p, project_id: project.id, due_date: p.dueDate }));
    const { error: paymentsError } = await supabase.from('payments').upsert(paymentsToUpsert);
    
    if(paymentsError) {
        console.error("Error upserting payments:", paymentsError);
        throw new Error("Falha ao atualizar as parcelas do projeto.");
    }
    
    const finalProject = await getProjectById(project.id);
    if (!finalProject) throw new Error("Could not retrieve updated project.");

    return finalProject;
}


export const addVisit = async (visit: Omit<Visit, 'id' | 'created_at' | 'photos' | 'projectId' | 'budgetAmount' | 'budgetPdfUrl'>) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const dbVisitData = {
        client_id: visit.clientId,
        date: visit.date,
        status: visit.status,
        summary: visit.summary,
        photos: []
    };
    const { data: newVisit, error } = await supabase.from('visits').insert([dbVisitData]).select().single();
    if(error) {
        console.error("Error creating visit:", error);
        throw new Error("Falha ao agendar visita.");
    }
    return newVisit as Visit;
}

export const updateVisit = async (visit: Omit<Visit, 'created_at'>) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const dbVisitData = {
        id: visit.id,
        client_id: visit.clientId,
        project_id: visit.projectId,
        date: visit.date,
        status: visit.status,
        summary: visit.summary,
        photos: visit.photos,
        budget_amount: visit.budgetAmount,
        budget_pdf_url: visit.budgetPdfUrl
    }
    const { data, error } = await supabase.from('visits').update(dbVisitData).eq('id', visit.id).select().single();
    if (error) {
        console.error("Error updating visit:", error);
        throw new Error("Falha ao atualizar a visita.");
    }
    return data as Visit;
};

export const addPhotoToVisit = async (photoData: Omit<Photo, 'id'> & { visitId: string }) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const visit = await getVisitById(photoData.visitId);
    if (!visit) throw new Error("Visita não encontrada");
    
    const newPhoto: Photo = { ...photoData, id: crypto.randomUUID() };
    const updatedPhotos = [...(visit.photos || []), newPhoto];
    
    const { data, error } = await supabase.from('visits').update({ photos: updatedPhotos }).eq('id', photoData.visitId).select().single();
    if(error) {
        console.error("Error adding photo to visit:", error);
        throw new Error("Falha ao adicionar foto.");
    }
    return data as Visit;
}

export const addPhotoToProject = async (
    projectId: string, 
    photoType: 'before' | 'after', 
    photoData: Omit<Photo, 'id'>
): Promise<Project> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const project = await getProjectById(projectId);
    if(!project) throw new Error("Projeto não encontrado");

    const newPhoto = { ...photoData, id: crypto.randomUUID() };
    const fieldName = photoType === 'before' ? 'photos_before' : 'photos_after';
    const currentPhotos = (photoType === 'before' ? project.photosBefore : project.photosAfter) || [];
    const updatedPhotos = [...currentPhotos, newPhoto];

    const { data: updatedProjectData, error } = await supabase.from('projects')
        .update({ [fieldName]: updatedPhotos })
        .eq('id', projectId)
        .select()
        .single();
        
     if(error || !updatedProjectData) {
        console.error(`Error adding ${photoType} photo to project:`, error);
        throw new Error("Falha ao adicionar foto ao projeto.");
    }
    
    // We need to re-fetch payments to return the full Project object
    const finalProject = await getProjectById(projectId);
    if (!finalProject) throw new Error("Failed to refetch project after adding photo.");

    return finalProject;
}

export const addBudgetToVisit = async (visitId: string, budgetAmount: number, budgetPdfUrl: string) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { data, error } = await supabase.from('visits').update({ budget_amount: budgetAmount, budget_pdf_url: budgetPdfUrl }).eq('id', visitId).select().single();
    if (error) {
        console.error("Error adding budget to visit:", error);
        throw new Error("Falha ao adicionar orçamento.");
    }
    return data as Visit;
}

export const checkForVisitConflict = async (newVisit: { clientId: string, date: string, visitId?: string }): Promise<Visit | null> => {
    if (!supabase) return null;
    if (!newVisit.clientId || !newVisit.date) {
        return null;
    }
    
    const newVisitTime = new Date(newVisit.date).getTime();
    const fourHours = 4 * 60 * 60 * 1000;
    const lowerBound = new Date(newVisitTime - fourHours).toISOString();
    const upperBound = new Date(newVisitTime + fourHours).toISOString();

    let query = supabase.from('visits')
        .select('*')
        .eq('client_id', newVisit.clientId)
        .gte('date', lowerBound)
        .lte('date', upperBound);

    if (newVisit.visitId) {
        query = query.neq('id', newVisit.visitId);
    }
    
    const { data, error } = await query;
    
    if (error) {
        console.error("Error checking for visit conflict:", error);
        return null;
    }
    
    return data && data.length > 0 ? data[0] as Visit : null;
}

export const checkForProjectConflict = async (newProject: { clientId: string, startDate: string, endDate: string, projectId?: string }): Promise<Project | null> => {
    if (!supabase) return null;
    let query = supabase.from('projects')
        .select('*')
        .eq('client_id', newProject.clientId)
        .lte('start_date', newProject.endDate)
        .gte('end_date', newProject.startDate)
    
    if (newProject.projectId) {
        query = query.neq('id', newProject.projectId);
    }
    
    const { data, error } = await query;

     if (error) {
        console.error("Error checking for project conflict:", error);
        return null;
    }

    return data && data.length > 0 ? data[0] as Project : null;
}
