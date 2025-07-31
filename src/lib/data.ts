

import type { Client, Project, Visit, Photo, VisitsSummary, ScheduleItem, Payment, MasterDataItem, UserProfile } from './definitions';
import { supabase } from './supabaseClient';

// --- Helper Functions ---

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

const getProjectPaymentStatus = (payments: Payment[] | undefined): string => {
    if (!payments || payments.length === 0) {
        return 'pendente';
    }
    const paidCount = payments.filter(p => p.status === 'pago').length;
    if (paidCount === 0) return 'pendente';
    if (paidCount === payments.length) return 'pago';
    return 'parcialmente pago';
}

const projectFromSupabase = (p_raw: any, allPayments: any[]): Project => {
    const payments = toCamelCase(allPayments.filter(payment => payment.project_id === p_raw.id)) as Payment[];
    return {
        id: p_raw.id,
        createdAt: p_raw.created_at,
        clientId: p_raw.client_id,
        visitId: p_raw.visit_id,
        name: p_raw.name,
        description: p_raw.description,
        status: p_raw.status,
        startDate: p_raw.start_date,
        endDate: p_raw.end_date,
        value: p_raw.value,
        discountPercentage: p_raw.discount_percentage,
        discountAmount: p_raw.discount_amount,
        finalValue: p_raw.final_value,
        paymentMethod: p_raw.payment_method,
        paymentInstrument: p_raw.payment_instrument,
        photosBefore: p_raw.photos_before || [],
        photosAfter: p_raw.photos_after || [],
        payments: payments,
        paymentStatus: getProjectPaymentStatus(payments)
    };
}


// --- User Authentication and Management ---

export const getProfiles = async (): Promise<UserProfile[]> => {
    if (!supabase) return [];
    
    // Chama a função do banco de dados que busca perfis e e-mails de forma segura
    const { data: profiles, error } = await supabase.rpc('get_all_user_profiles');

    if (error) {
        console.error("Error fetching profiles with RPC:", error);
        return [];
    }

    if (!profiles) {
        return [];
    }
    
    return profiles.map(profile => ({
        id: profile.id,
        fullName: profile.full_name,
        status: profile.status,
        email: profile.email || 'E-mail não disponível',
        role: profile.role || 'usuario'
    }));
};


export const updateProfile = async (userId: string, updates: { status?: 'authorized' | 'revoked', role?: 'administrador' | 'usuario' }): Promise<UserProfile> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error("Error updating profile:", error);
        throw new Error("Não foi possível atualizar o perfil do usuário.");
    }

    return toCamelCase(data);
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
        createdAt: c.created_at,
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
    return toCamelCase(data) as Client;
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
        return projectsData.map(p_raw => projectFromSupabase(p_raw, []));
    }

    return projectsData.map(p_raw => projectFromSupabase(p_raw, paymentsData || []));
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
        return projectFromSupabase(projectData, []);
    }
    
    return projectFromSupabase(projectData, paymentsData || []);
};


export const getVisits = async (): Promise<Visit[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('visits').select('*').order('date', { ascending: false });
    if (error) {
        console.error("Error fetching visits:", error);
        return [];
    }
    return toCamelCase(data) as Visit[];
};

export const getVisitById = async (id: string): Promise<Visit | null> => {
    if (!supabase || !id) return null;
    const { data, error } = await supabase.from('visits').select('*').eq('id', id).single();
    if (error) {
        console.error(`Error fetching visit ${id}:`, error);
        return null;
    }
    return toCamelCase(data) as Visit;
}


// --- Dashboard-specific data functions ---

export const getActiveProjects = async (): Promise<Project[]> => {
    if (!supabase) return [];
    const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('status', ['Em andamento', 'A iniciar', 'Pausado', 'Atrasado'])
        .gte('end_date', new Date().toISOString())
        .order('end_date', { ascending: true });
        
    if (projectsError) {
        console.error("Error fetching active projects:", projectsError);
        return [];
    }
    
    const projectIds = projectsData.map(p => p.id);
    if(projectIds.length === 0) return [];
    
    const { data: paymentsData, error: paymentsError } = await supabase.from('payments').select('*').in('project_id', projectIds);
     if (paymentsError) {
        return projectsData.map(p_raw => projectFromSupabase(p_raw, []));
    }

    return projectsData.map(p_raw => projectFromSupabase(p_raw, paymentsData || []));
};


export const getUpcomingVisits = async (): Promise<Visit[]> => {
    if (!supabase) return [];
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 7);
    
    const { data, error } = await supabase
        .from('visits')
        .select('*')
        .gte('date', today.toISOString())
        .lte('date', future.toISOString())
        .order('date', { ascending: true });
        
    if (error) {
        console.error("Error fetching upcoming visits:", error);
        return [];
    }
    return toCamelCase(data) as Visit[];
};

export const getVisitsSummary = async (): Promise<VisitsSummary> => {
    if (!supabase) return {};
    const { data, error } = await supabase.from('visits').select('status');
    if (error) {
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
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
        { data: visitsData, error: visitsError },
        { data: projectsData, error: projectsError },
        clients
    ] = await Promise.all([
        supabase.from('visits').select('*')
            .gte('date', startOfDay.toISOString())
            .lte('date', endOfDay.toISOString()),
        supabase.from('projects').select('*')
            .lt('start_date', endOfDay.toISOString())
            .gt('end_date', startOfDay.toISOString())
            .in('status', ['Em andamento', 'Atrasado']),
        getClients()
    ]);

    if (visitsError) console.error("Error fetching today's visits:", visitsError);
    if (projectsError) console.error("Error fetching today's projects:", projectsError);

    const clientMap = new Map(clients.map(c => [c.id, c]));

    const schedule: ScheduleItem[] = [];

    (visitsData || []).forEach(v => {
        const client = clientMap.get(v.client_id);
        if (client) {
            schedule.push({
                id: `visit-${v.id}`,
                type: 'visit',
                date: v.date,
                time: new Date(v.date).toLocaleTimeString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }),
                title: 'Visita Agendada',
                clientName: client.name,
                clientId: client.id,
                status: v.status,
                path: `/visits/${v.id}`,
                clientPhone: client.phone,
                clientAddress: client.address,
                isOverdue: new Date(v.date) < now && v.status === 'pendente'
            });
        }
    });
    
     (projectsData || []).forEach(p => {
        const client = clientMap.get(p.client_id);
        const isOverdue = new Date(p.end_date) < now;
        if (client) {
            schedule.push({
                id: `project-${p.id}`,
                type: 'project',
                date: p.start_date, // For sorting purposes
                title: p.name,
                clientName: client.name,
                clientId: client.id,
                status: isOverdue ? 'Atrasado' : p.status,
                path: `/projects/${p.id}`,
                clientPhone: client.phone,
                clientAddress: client.address,
                projectStartDate: p.start_date,
                projectEndDate: p.end_date,
                isOverdue: isOverdue
            });
        }
    });

    return schedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};


// --- Financial data functions ---

export const getTotalRevenue = async ({ startDate, endDate }: { startDate?: string, endDate?: string } = {}): Promise<number> => {
     if (!supabase) return 0;
    
    let query = supabase.from('payments').select('amount').eq('status', 'pago');
    if (startDate && endDate) {
        query = query.gte('due_date', startDate).lte('due_date', endDate);
    }
    
    const { data, error } = await query;

    if (error) {
        console.error("Error fetching total revenue:", error);
        return 0;
    }
    
    return data.reduce((sum, payment) => sum + payment.amount, 0);
};

export const getTotalPendingRevenue = async ({ startDate, endDate }: { startDate?: string, endDate?: string } = {}): Promise<number> => {
    if (!supabase) return 0;

    let query = supabase.from('payments').select('amount').eq('status', 'pendente');
    if (startDate && endDate) {
        query = query.gte('due_date', startDate).lte('due_date', endDate);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Error fetching pending revenue:", error);
        return 0;
    }
    return data.reduce((sum, payment) => sum + payment.amount, 0);
};

export const getProjectsByClientId = async (clientId: string): Promise<Project[]> => {
    if(!supabase || !clientId) return [];
    
    const { data, error } = await supabase.from('projects').select('*').eq('client_id', clientId);
    if(error) {
        console.error("Error fetching projects by client:", error);
        return [];
    }
    
    const projectIds = data.map(p => p.id);
    if(projectIds.length === 0) return [];
    
    const { data: paymentsData, error: paymentsError } = await supabase.from('payments').select('*').in('project_id', projectIds);
     if (paymentsError) {
        return data.map(p_raw => projectFromSupabase(p_raw, []));
    }
    
    return data.map(p_raw => projectFromSupabase(p_raw, paymentsData || []));
};

export const getVisitsByClientId = async (clientId: string): Promise<Visit[]> => {
    if(!supabase || !clientId) return [];
    
    const { data, error } = await supabase.from('visits').select('*').eq('client_id', clientId).order('date', {ascending: false});
     if(error) {
        console.error("Error fetching visits by client:", error);
        return [];
    }
    return toCamelCase(data);
};


// --- Conflict Checkers ---

export const checkForVisitConflict = async ({clientId, date, visitId}: {clientId: string, date: string, visitId?: string}) => {
    if(!supabase || !clientId || !date) return null;

    const targetDate = new Date(date);
    const oneHourBefore = new Date(targetDate.getTime() - 60 * 60 * 1000).toISOString();
    const oneHourAfter = new Date(targetDate.getTime() + 60 * 60 * 1000).toISOString();

    let query = supabase.from('visits')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', oneHourBefore)
        .lte('date', oneHourAfter);

    if (visitId) {
        query = query.not('id', 'eq', visitId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error checking for visit conflict:", error);
        return null;
    }

    return data && data.length > 0 ? data[0] : null;
}

export const checkForProjectConflict = async ({clientId, startDate, endDate, projectId}: {clientId: string, startDate: string, endDate: string, projectId?: string}) => {
     if(!supabase || !clientId || !startDate || !endDate) return null;
     
     let query = supabase.from('projects')
        .select('*')
        .eq('client_id', clientId)
        .overlap('start_date', [startDate, endDate]);
        
     if (projectId) {
        query = query.not('id', 'eq', projectId);
    }
    
    const { data, error } = await query;
    
     if (error) {
        console.error("Error checking for project conflict:", error);
        return null;
    }
    
    return data && data.length > 0 ? toCamelCase(data[0]) : null;
}


// --- Mutation Functions ---
export const addClient = async (client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabase
        .from('clients')
        .insert({
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address,
            preferences: client.preferences,
            cpf: client.cpf,
            birthday: client.birthday,
        })
        .select()
        .single();
    if (error) {
        console.error("Error adding client:", error);
        throw new Error("Não foi possível adicionar o cliente.");
    }
    return toCamelCase(data);
};

export const addVisit = async (visit: Omit<Visit, 'id' | 'createdAt' | 'photos' | 'projectId'>): Promise<Visit> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    
    const { data, error } = await supabase
        .from('visits')
        .insert({
            client_id: visit.clientId,
            date: new Date(visit.date).toISOString(),
            summary: visit.summary,
            status: visit.status,
            photos: []
        })
        .select()
        .single();
    
    if (error) {
        console.error("Error adding visit:", error);
        throw new Error("Não foi possível agendar a visita.");
    }

    return toCamelCase(data) as Visit;
}

export const updateVisit = async (visit: Visit): Promise<Visit> => {
     if (!supabase) throw new Error("Supabase client not initialized.");
     
     const { data, error } = await supabase
        .from('visits')
        .update({
            client_id: visit.clientId,
            date: new Date(visit.date).toISOString(),
            summary: visit.summary,
            status: visit.status,
            project_id: visit.projectId,
            photos: visit.photos,
            budget_amount: visit.budgetAmount,
            budget_pdf_url: visit.budgetPdfUrl
        })
        .eq('id', visit.id)
        .select()
        .single();
        
    if(error) {
        console.error(`Error updating visit ${visit.id}:`, error);
        throw new Error("Não foi possível atualizar a visita.");
    }
    
    return toCamelCase(data) as Visit;
}


export const addPhotoToVisit = async (photoData: { visitId: string, url: string, description: string, type: string }): Promise<Visit> => {
    if (!supabase) throw new Error("Supabase client not initialized.");

    const visit = await getVisitById(photoData.visitId);
    if (!visit) throw new Error("Visita não encontrada.");
    
    const newPhoto: Photo = {
        id: crypto.randomUUID(),
        url: photoData.url,
        description: photoData.description,
        type: photoData.type as 'camera' | 'upload'
    }

    const updatedPhotos = [...(visit.photos || []), newPhoto];

    const { data, error } = await supabase
        .from('visits')
        .update({ photos: updatedPhotos })
        .eq('id', photoData.visitId)
        .select()
        .single();
    
    if (error) {
        console.error("Error adding photo to visit:", error);
        throw new Error("Não foi possível adicionar a foto.");
    }
    
    return toCamelCase(data) as Visit;
}


export const addBudgetToVisit = async (visitId: string, amount: number, pdfUrl: string): Promise<Visit> => {
     if (!supabase) throw new Error("Supabase client not initialized.");
     
     const { data, error } = await supabase
        .from('visits')
        .update({ budget_amount: amount, budget_pdf_url: pdfUrl, status: 'orçamento' })
        .eq('id', visitId)
        .select()
        .single();

     if (error) {
        console.error("Error adding budget to visit:", error);
        throw new Error("Não foi possível salvar o orçamento.");
    }
    
    return toCamelCase(data) as Visit;
}


export const addProject = async (project: Omit<Project, 'id' | 'paymentStatus'>): Promise<Project> => {
    if (!supabase) throw new Error("Supabase client not initialized.");

    const { payments, ...projectDetails } = project;
    
    const dbProjectData = {
        client_id: projectDetails.clientId,
        visit_id: projectDetails.visitId,
        name: projectDetails.name,
        description: projectDetails.description,
        start_date: projectDetails.startDate,
        end_date: projectDetails.endDate,
        value: projectDetails.value,
        discount_percentage: projectDetails.discountPercentage,
        discount_amount: projectDetails.discountAmount,
        final_value: projectDetails.finalValue,
        payment_method: projectDetails.paymentMethod,
        payment_instrument: projectDetails.paymentInstrument,
        status: projectDetails.status,
    };
    
    const { data: newProjectData, error: projectError } = await supabase
        .from('projects')
        .insert(dbProjectData)
        .select()
        .single();
    
    if (projectError) {
        console.error("Error adding project:", projectError);
        throw new Error("Não foi possível criar o projeto.");
    }
    
    if (project.visitId) {
        await supabase.from('visits').update({ project_id: newProjectData.id }).eq('id', project.visitId);
    }
    
    const paymentsWithProjectId = payments.map(p => ({
        project_id: newProjectData.id,
        amount: p.amount,
        status: p.status,
        due_date: p.dueDate,
        description: p.description
    }));

    const { error: paymentError } = await supabase.from('payments').insert(paymentsWithProjectId);
    if(paymentError) {
        console.error("Error adding payments:", paymentError);
        // Rollback project creation? For now, we'll just log the error.
        throw new Error("Projeto criado, mas houve um erro ao salvar as parcelas.");
    }

    return projectFromSupabase(newProjectData, paymentsWithProjectId);
};

export const updateProject = async (project: Project): Promise<Project> => {
    if (!supabase) throw new Error("Supabase client not initialized.");

    const { payments, ...projectDetails } = project;
    
     const dbProjectData = {
        client_id: projectDetails.clientId,
        visit_id: projectDetails.visitId,
        name: projectDetails.name,
        description: projectDetails.description,
        start_date: projectDetails.startDate,
        end_date: projectDetails.endDate,
        value: projectDetails.value,
        discount_percentage: projectDetails.discountPercentage,
        discount_amount: projectDetails.discountAmount,
        final_value: projectDetails.finalValue,
        payment_method: projectDetails.paymentMethod,
        payment_instrument: projectDetails.paymentInstrument,
        photos_before: projectDetails.photosBefore,
        photos_after: projectDetails.photosAfter,
        status: project.status,
    };
    
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
    
    // This is complex. For now, we assume payments are managed separately or don't change structure often.
    // A more robust solution would diff and update/insert/delete payments.
    // For this app's logic, we can just update them.
    for (const payment of payments) {
        const { error: paymentError } = await supabase.from('payments').update({
            amount: payment.amount,
            status: payment.status,
            due_date: payment.dueDate
        }).eq('id', payment.id);

        if (paymentError) {
            console.error("Error updating payment:", paymentError);
            // Decide on error handling strategy, for now continue
        }
    }
    
    return projectFromSupabase(updatedProjectData, payments);
};

export const addPhotoToProject = async (projectId: string, photoType: 'before' | 'after', photoData: Omit<Photo, 'id'>): Promise<Project> => {
     if (!supabase) throw new Error("Supabase client not initialized.");
     
     const project = await getProjectById(projectId);
     if (!project) throw new Error("Projeto não encontrado.");

    const newPhoto: Photo = {
        id: crypto.randomUUID(),
        ...photoData
    };
    
    const updatedPhotos = photoType === 'before'
        ? [...project.photosBefore, newPhoto]
        : [...project.photosAfter, newPhoto];
        
    const fieldToUpdate = photoType === 'before' ? 'photos_before' : 'photos_after';
    
    const { data, error } = await supabase
        .from('projects')
        .update({ [fieldToUpdate]: updatedPhotos })
        .eq('id', projectId)
        .select()
        .single();
        
    if (error) {
        console.error("Error adding photo to project:", error);
        throw new Error("Não foi possível adicionar a foto ao projeto.");
    }
    
    const allPayments = await supabase.from('payments').select('*').eq('project_id', data.id);
    
    return projectFromSupabase(data, allPayments.data || []);
}


// --- Master Data Functions ---

export const getVisitStatusOptions = async (): Promise<MasterDataItem[]> => {
    if (!supabase) return [{ id: '1', name: 'pendente', created_at: '' }, { id: '2', name: 'realizada', created_at: '' }, { id: '3', name: 'cancelada', created_at: '' }];
    const { data, error } = await supabase.from('master_visit_status').select('*');
    if (error) {
        console.error("Error fetching visit status options:", error);
        return [];
    }
    return data;
}

export const addVisitStatusOption = async (name: string): Promise<MasterDataItem> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabase.from('master_visit_status').insert({ name }).select().single();
    if (error) {
        console.error("Error adding visit status option:", error);
        throw new Error("Não foi possível adicionar a opção.");
    }
    return data;
}

export const deleteVisitStatusOption = async (id: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { error } = await supabase.from('master_visit_status').delete().eq('id', id);
    if (error) {
        console.error("Error deleting visit status option:", error);
        throw new Error("Não foi possível remover a opção.");
    }
}

export const getPaymentInstrumentsOptions = async (): Promise<MasterDataItem[]> => {
    if (!supabase) return [{ id: '1', name: 'PIX', created_at: '' }, { id: '2', name: 'Dinheiro', created_at: '' }];
    const { data, error } = await supabase.from('master_payment_instruments').select('*');
    if (error) {
        console.error("Error fetching payment instruments:", error);
        return [];
    }
    return data;
}

export const addPaymentInstrumentOption = async (name: string): Promise<MasterDataItem> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabase.from('master_payment_instruments').insert({ name }).select().single();
    if (error) {
        console.error("Error adding payment instrument:", error);
        throw new Error("Não foi possível adicionar a opção.");
    }
    return data;
}

export const deletePaymentInstrumentOption = async (id: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { error } = await supabase.from('master_payment_instruments').delete().eq('id', id);
    if (error) {
        console.error("Error deleting payment instrument:", error);
        throw new Error("Não foi possível remover a opção.");
    }
}

export const getProjectStatusOptions = async (): Promise<MasterDataItem[]> => {
    if (!supabase) return [{ id: '1', name: 'A iniciar', created_at: '' }];
    const { data, error } = await supabase.from('master_project_status').select('*');
    if (error) {
        console.error("Error fetching project status options:", error);
        return [];
    }
    return data;
}

export const addProjectStatusOption = async (name: string): Promise<MasterDataItem> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data, error } = await supabase.from('master_project_status').insert({ name }).select().single();
    if (error) {
        console.error("Error adding project status option:", error);
        throw new Error("Não foi possível adicionar a opção.");
    }
    return data;
}

export const deleteProjectStatusOption = async (id: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { error } = await supabase.from('master_project_status').delete().eq('id', id);
    if (error) {
        console.error("Error deleting project status option:", error);
        throw new Error("Não foi possível remover a opção.");
    }
}

    

    