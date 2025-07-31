

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

const getProjectExecutionStatus = (p: { start_date: string, end_date: string, status: string }): string => {
    // If status was manually set, respect it.
    if (p.status && !['A iniciar', 'Em andamento', 'Concluído'].includes(p.status)) {
        return p.status;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(p.start_date);
    const endDate = new Date(p.end_date);

    if (endDate < today) return 'Concluído';
    if (startDate > today) return 'A iniciar';
    return 'Em andamento';
}

const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => {
                const camelKey = key.replace(/([-_][a-z])/g, g => g.toUpperCase().replace(/[-_]/, ''));
                result[camelKey] = toCamelCase(obj[key]);
                return result;
            },
            {} as any
        );
    }
    return obj;
};

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
        return projectsData.map(p => ({ ...toCamelCase(p), payments: [], paymentStatus: 'pendente' } as Project));
    }

    return projectsData.map(p_raw => {
        const p = toCamelCase(p_raw) as any; 
        const payments = toCamelCase(paymentsData?.filter(payment => payment.project_id === p.id) || []) as Payment[];
        
        return { 
            ...p,
            status: getProjectExecutionStatus(p_raw),
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
        return { ...toCamelCase(projectData), payments: [], paymentStatus: 'pendente' } as Project;
    }
    
    const p = toCamelCase(projectData) as any;
    const payments = toCamelCase(paymentsData || []) as Payment[];

    return { 
        ...p,
        status: getProjectExecutionStatus(projectData),
        payments: payments, 
        paymentStatus: getProjectPaymentStatus(payments) 
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
    return data.map(v_raw => toCamelCase(v_raw) as Visit);
};
export const getVisitById = async (id: string): Promise<Visit | null> => {
    if (!supabase || !id) return null;
    const { data, error } = await supabase.from('visits').select('*').eq('id', id).single();
    if (error || !data) {
        console.error(`Error fetching visit ${id}:`, error);
        return null;
    }
    return toCamelCase(data) as Visit;
};
export const getVisitsByClientId = async (clientId: string): Promise<Visit[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('visits').select('*').eq('client_id', clientId).order('date', { ascending: false });
     if (error) {
        console.error(`Error fetching visits for client ${clientId}:`, error);
        return [];
    }
    return data.map(v_raw => toCamelCase(v_raw) as Visit);
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
        if(error) console.log("Error fetching visit status options, using fallback.");
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
        if(error) console.log("Error fetching payment instruments, using fallback.");
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
export const getTotalRevenue = async (dateRange?: { startDate?: string, endDate?: string }) => {
    if (!supabase) return 0;
    let query = supabase.from('payments').select('amount').eq('status', 'pago');

    if (dateRange?.startDate) {
        query = query.gte('due_date', dateRange.startDate);
    }
    if (dateRange?.endDate) {
        query = query.lte('due_date', dateRange.endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching total revenue:", error);
        return 0;
    }
    return data.reduce((sum, payment) => sum + (payment.amount || 0), 0);
};

export const getTotalPendingRevenue = async (dateRange?: { startDate?: string, endDate?: string }) => {
    if (!supabase) return 0;
    let query = supabase.from('payments').select('amount').eq('status', 'pendente');

    if (dateRange?.startDate) {
        query = query.gte('due_date', dateRange.startDate);
    }
    if (dateRange?.endDate) {
        query = query.lte('due_date', dateRange.endDate);
    }

    const { data, error } = await query;

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
    return data.map(v_raw => toCamelCase(v_raw) as Visit);
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
    
    const nowInBrazilString = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).substring(0, 16).replace(' ', 'T');


    todayVisits.forEach(v_raw => {
        const v = v_raw as any;
        const client = getClient(v.client_id);
        const visitDate = new Date(v.date);
        
        schedule.push({
            id: v.id,
            type: 'visit',
            date: v.date,
            time: visitDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
            title: `Visita`,
            clientName: client?.name ?? 'Cliente desconhecido',
            clientId: v.client_id,
            clientPhone: client?.phone,
            clientAddress: client?.address,
            status: v.status,
            path: `/visits/${v.id}`,
            isOverdue: v.status === 'pendente' && nowInBrazilString > v.date.substring(0, 16),
        });
    });

    const projectIds = todayProjects.map(p => p.id);
    if (projectIds.length > 0) {
        const { data: paymentsData } = await supabase.from('payments').select('*').in('project_id', projectIds);
        
        todayProjects.forEach(p_raw => {
            const p = p_raw as any;
            const client = getClient(p.client_id);
            const payments = toCamelCase(paymentsData?.filter(pm => pm.project_id === p.id) || []) as Payment[];
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
                status: getProjectPaymentStatus(payments),
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

export const addProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'paymentStatus'>) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const { payments: paymentsData, ...projectCoreData } = projectData;
    
    const dbProjectData = {
      client_id: projectCoreData.clientId,
      visit_id: projectCoreData.visitId,
      name: projectCoreData.name,
      description: projectCoreData.description,
      start_date: projectCoreData.startDate,
      end_date: projectCoreData.endDate,
      status: projectCoreData.status,
      value: projectCoreData.value,
      discount_percentage: projectCoreData.discountPercentage,
      discount_amount: projectCoreData.discountAmount,
      final_value: projectCoreData.finalValue,
      payment_method: projectCoreData.paymentMethod,
      payment_instrument: projectCoreData.paymentInstrument,
      photos_before: projectCoreData.photosBefore || [],
      photos_after: projectCoreData.photosAfter || [],
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
    const paymentsToInsert = paymentsData.map(p => {
        return { 
            amount: p.amount,
            status: p.status,
            due_date: p.dueDate,
            description: p.description,
            project_id: newProject.id 
        };
    });
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

export const updateProject = async (project: Project): Promise<Project> => {
    if (!supabase) throw new Error("Supabase client is not initialized.");

    const dbProjectData = {
        client_id: project.clientId,
        visit_id: project.visitId,
        name: project.name,
        description: project.description,
        start_date: project.startDate,
        end_date: project.endDate,
        status: project.status,
        value: project.value,
        discount_percentage: project.discountPercentage,
        discount_amount: project.discountAmount,
        final_value: project.finalValue,
        payment_method: project.paymentMethod,
        payment_instrument: project.paymentInstrument,
        photos_before: project.photosBefore || [],
        photos_after: project.photosAfter || [],
    };
    
    // 1. Update the core project data
    const { data: updatedProjectData, error: projectError } = await supabase
        .from('projects')
        .update(dbProjectData)
        .eq('id', project.id)
        .select()
        .single();

    if (projectError) {
        console.error("Error updating project:", projectError);
        throw new Error("Falha ao atualizar o projeto.");
    }

    // 2. Upsert payments (update existing, insert new)
    const paymentsToUpsert = project.payments.map(p => ({
        id: p.id,
        project_id: project.id,
        amount: p.amount,
        status: p.status,
        due_date: p.dueDate,
        description: p.description
    }));
    
    const { error: paymentsError } = await supabase.from('payments').upsert(paymentsToUpsert, { onConflict: 'id' });
    
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
        date: visit.date, // The string from datetime-local is sent as is
        status: visit.status,
        summary: visit.summary,
        photos: []
    };
    const { data: newVisit, error } = await supabase.from('visits').insert([dbVisitData]).select().single();
    if(error) {
        console.error("Error creating visit:", error);
        throw new Error("Falha ao agendar visita.");
    }
    return toCamelCase(newVisit) as Visit;
}

export const updateVisit = async (visit: Omit<Visit, 'created_at'>) => {
    if (!supabase) throw new Error("Supabase client is not initialized.");
    const dbVisitData = {
        id: visit.id,
        client_id: visit.clientId,
        project_id: visit.projectId,
        date: visit.date, // The string from datetime-local is sent as is
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
    return toCamelCase(data) as Visit;
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
    return toCamelCase(data) as Visit;
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
    return toCamelCase(data) as Visit;
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
    
    return data && data.length > 0 ? toCamelCase(data[0]) as Visit : null;
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

    return data && data.length > 0 ? toCamelCase(data[0]) as Project : null;
}
