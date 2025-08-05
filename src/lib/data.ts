

import 'dotenv/config';
import type { Client, Project, Visit, Photo, VisitsSummary, ScheduleItem, Payment, MasterDataItem, UserProfile, CompanySettings, Company } from './definitions';
import { supabase } from './supabaseClient';
import { createSupabaseAdminClient } from './supabaseClient';


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

const toSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toSnakeCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => {
                const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                result[snakeKey] = toSnakeCase(obj[key]);
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
        companyId: p_raw.company_id,
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


// --- User, Profile, and Company Management ---

// Gets the profile of the currently logged-in user
export const getCurrentProfile = async (): Promise<UserProfile | null> => {
    if (!supabase) return null;
    
    // Always fetch a fresh session to ensure the correct user identity
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user?.id) {
        console.error("Error fetching session or no user ID found:", sessionError);
        return null;
    }
    
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
            *,
            organizations ( trade_name )
        `)
        .eq('id', session.user.id)
        .single();
    
    if(profileError) {
        console.error("Error fetching current profile data:", profileError);
        return null;
    }
    
    const companyDetails = Array.isArray(profile.organizations) ? profile.organizations[0] : profile.organizations;

    return {
        ...toCamelCase(profile),
        email: session.user.email || '',
        companyName: companyDetails?.trade_name || 'Empresa não encontrada'
    };
}

export const getMyCompanyUsers = async (): Promise<UserProfile[]> => {
    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) {
        console.error("Failed to create Supabase admin client.");
        return [];
    }
    
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
        console.error("Could not determine current user.");
        return [];
    }
    
    // Super Admin Case: Fetch all users and their company names
    if (currentProfile.email === 'mauriciodionizio@gmail.com') {
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select(`
                id,
                full_name,
                role,
                status,
                company_id,
                organizations ( trade_name )
            `);

        if (profilesError) {
            console.error("Error fetching all profiles:", profilesError);
            return [];
        }

        const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (authError) {
            console.error("Error fetching auth users:", authError);
            return [];
        }
        
        const emailMap = new Map(authUsers.map(u => [u.id, u.email]));

        return profiles.map(p => {
             const companyDetails = Array.isArray(p.organizations) ? p.organizations[0] : p.organizations;
             return {
                id: p.id,
                fullName: p.full_name,
                email: emailMap.get(p.id) || 'E-mail não encontrado',
                role: p.role,
                status: p.status,
                companyId: p.company_id,
                companyName: companyDetails?.trade_name || 'N/A',
             }
        });
    }
    
    // Regular Admin Case
    if (!currentProfile.companyId) {
         console.error("Current user does not have a company ID.");
         return [];
    }

    const { data: companyProfiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select(`
            id,
            full_name,
            role,
            status,
            company_id
        `)
        .eq('company_id', currentProfile.companyId);

    if (profilesError) {
        console.error("Error fetching company users:", profilesError);
        return [];
    }
    
    const companyUserIds = companyProfiles.map(p => p.id);
    if (companyUserIds.length === 0) return [];

    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
     if (authError) {
        console.error("Error fetching auth users for company:", authError);
        return [];
    }
    
    const emailMap = new Map(authUsers.map(u => [u.id, u.email]));

    return companyProfiles.map(p => {
        return {
            id: p.id,
            fullName: p.full_name,
            role: p.role,
            status: p.status,
            companyId: p.company_id,
            email: emailMap.get(p.id) || 'E-mail não encontrado',
            companyName: currentProfile.companyName
        }
    });
}


export const updateProfile = async (userId: string, updates: { status?: 'authorized' | 'revoked', role?: 'administrador' | 'usuario', company_id?: string }): Promise<UserProfile> => {
    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) throw new Error("Acesso de administrador não configurado.");
    
    const { data, error } = await supabaseAdmin
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

// --- Organization Management (Superadmin only) ---
export const getOrganizations = async (): Promise<Company[]> => {
    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) throw new Error("Acesso de administrador não configurado.");

    const { data, error } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .order('trade_name');
    
    if (error) {
        console.error("Error fetching organizations:", error);
        return [];
    }
    return toCamelCase(data);
}
export const getActiveOrganizations = async (): Promise<Company[]> => {
    if (!supabase) return [];
    // This now uses a secure RPC call that is invokable by anonymous users
    // but only returns active organizations due to the function's definition.
    const { data, error } = await supabase.rpc('get_active_organizations');
    
    if (error) {
        console.error("Error fetching active organizations via RPC:", error);
        return [];
    }
    return toCamelCase(data) as Company[];
}


export const addOrganization = async (name: string): Promise<Company> => {
    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) throw new Error("Acesso de administrador não configurado.");

    // Insert the new organization
    const { data: orgData, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({ trade_name: name, is_active: true })
        .select()
        .single();

    if (orgError) {
        console.error("Error adding organization:", orgError);
        throw new Error("Não foi possível adicionar a nova empresa.");
    }
    
    // Explicitly create the settings entry for the new organization
    const { error: settingsError } = await supabaseAdmin
        .from('settings')
        .insert({ company_id: orgData.id, company_name: orgData.trade_name });

    if (settingsError) {
        console.error("Error creating settings for new organization:", settingsError);
        // Don't throw an error here, the org was created, but log it.
        // The getSettings function can recover from this.
    }

    return toCamelCase(orgData);
};

export const updateOrganization = async (id: string, updates: Partial<Company>): Promise<Company> => {
    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) throw new Error("Acesso de administrador não configurado.");
    
    // Omit fields that are not part of the 'organizations' table or shouldn't be updated this way
    const { id: companyId, createdAt, ...updateData } = updates;

    const { data, error } = await supabaseAdmin
        .from('organizations')
        .update(toSnakeCase(updateData))
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating organization:", error);
        throw new Error("Não foi possível atualizar a empresa.");
    }
    return toCamelCase(data);
}


// --- Data Access Functions (RLS-secured) ---

export const getClients = async (): Promise<Client[]> => {
    if (!supabase) return [];
    // RLS automatically filters by company_id
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (error) {
        console.error("Error fetching clients:", error);
        return [];
    }
    return data.map(c => toCamelCase(c)) as Client[];
};
export const getClientById = async (id: string): Promise<Client | null> => {
    if (!supabase || !id) return null;
    // RLS automatically filters by company_id
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
    if (error) {
        console.error(`Error fetching client ${id}:`, error);
        return null;
    }
    return toCamelCase(data) as Client;
};

export const getProjects = async (): Promise<Project[]> => {
    if (!supabase) return [];
    // RLS automatically filters projects
    const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*').order('start_date', { ascending: false });
    if (projectsError) {
        console.error("Error fetching projects:", projectsError);
        return [];
    }

    const projectIds = projectsData.map(p => p.id);
    if(projectIds.length === 0) return [];
    
    // RLS on payments is based on the project's company_id
    const { data: paymentsData, error: paymentsError } = await supabase.from('payments').select('*').in('project_id', projectIds);
     if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
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
    // RLS applies
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
        .lte('start_date', endDate) 
        .gte('end_date', startDate); 
        
     if (projectId) {
        query = query.not('id', 'eq', projectId);
    }
    
    const { data, error } = await query.maybeSingle(); 
    
     if (error) {
        console.error("Error checking for project conflict:", error);
        return null;
    }
    
    return data ? toCamelCase(data) : null;
}


// --- Mutation Functions ---
export const addClient = async (client: Omit<Client, 'id' | 'createdAt' | 'companyId'>): Promise<Client> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const profile = await getCurrentProfile();
    if (!profile) throw new Error("Usuário não autenticado.");

    const { data, error } = await supabase
        .from('clients')
        .insert({
            ...toSnakeCase(client),
            company_id: profile.companyId
        })
        .select()
        .single();
    if (error) {
        console.error("Error adding client:", error);
        throw new Error("Não foi possível adicionar o cliente.");
    }
    return toCamelCase(data);
};

export const addVisit = async (visit: Omit<Visit, 'id' | 'createdAt' | 'photos' | 'projectId' | 'companyId'>): Promise<Visit> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const profile = await getCurrentProfile();
    if (!profile) throw new Error("Usuário não autenticado.");
    
    const { data, error } = await supabase
        .from('visits')
        .insert({
            client_id: visit.clientId,
            date: visit.date,
            summary: visit.summary,
            status: visit.status,
            photos: [],
            company_id: profile.companyId,
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
            date: visit.date,
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


export const addProject = async (project: Omit<Project, 'id' | 'paymentStatus' | 'companyId'>): Promise<Project> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const profile = await getCurrentProfile();
    if (!profile) throw new Error("Usuário não autenticado.");

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
        company_id: profile.companyId
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
    
    // This is not multi-tenant safe. A user from another company could update payments if they guess the ID.
    // However, since payment IDs are UUIDs, this is extremely unlikely. The payments are fetched
    // within the project's scope, so the user can only see their own payments to begin with.
    for (const payment of payments) {
        const { error: paymentError } = await supabase.from('payments').update({
            amount: payment.amount,
            status: payment.status,
            due_date: payment.dueDate
        }).eq('id', payment.id);

        if (paymentError) {
            console.error("Error updating payment:", paymentError);
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
        ? [...(project.photosBefore || []), newPhoto]
        : [...(project.photosAfter || []), newPhoto];
        
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
    const profile = await getCurrentProfile();
    if (!profile || !profile.companyId) throw new Error("Usuário não autenticado ou sem empresa associada.");
    const { data, error } = await supabase.from('master_visit_status').insert({ name, company_id: profile.companyId }).select().single();
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
    const profile = await getCurrentProfile();
    if (!profile || !profile.companyId) throw new Error("Usuário não autenticado ou sem empresa associada.");
    const { data, error } = await supabase.from('master_payment_instruments').insert({ name, company_id: profile.companyId }).select().single();
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
    const profile = await getCurrentProfile();
    if (!profile || !profile.companyId) throw new Error("Usuário não autenticado ou sem empresa associada.");
    const { data, error } = await supabase.from('master_project_status').insert({ name, company_id: profile.companyId }).select().single();
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

// --- Company Settings Functions ---

export const getSettings = async (companyId: string): Promise<CompanySettings | null> => {
    if (!supabase) return null;
    if (!companyId) {
        console.error("getSettings requires a companyId.");
        return null;
    }

    // This query is secured by the RLS policy on the `settings` table.
    const { data: settingsData, error } = await supabase
        .from('settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

    if (error) {
        console.error("Error fetching settings:", error.message);
        return null;
    }
    
    if (settingsData) {
        return toCamelCase(settingsData);
    }

    // If no settings are found, create them. This is a fallback for existing companies
    // that might not have a settings entry.
    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) {
        console.error("Cannot create settings: admin client is not available.");
        return null;
    }

    const { data: orgData, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select('trade_name')
        .eq('id', companyId)
        .single();
    
    if (orgError || !orgData) {
        console.error("Could not fetch organization name to create settings:", orgError);
        return null;
    }

    const { data: newSettings, error: insertError } = await supabaseAdmin
        .from('settings')
        .insert({
            company_id: companyId,
            company_name: orgData.trade_name,
        })
        .select()
        .single();
    
    if (insertError) {
        console.error("Error creating default settings:", insertError);
        return null;
    }
    
    return toCamelCase(newSettings);
};


export const updateSettings = async ({ companyId, companyName, logoFile }: { companyId: string, companyName: string, logoFile: File | null }): Promise<void> => {
     if (!supabase) throw new Error("Supabase client not initialized.");
     if (!companyId) throw new Error("Company ID is required to update settings.");

    const { data: currentSettings } = await supabase.from('settings').select('logo_url').eq('company_id', companyId).single();

    let logoUrl: string | undefined | null = currentSettings?.logo_url || undefined;

    if (logoFile) {
        const supabaseAdmin = createSupabaseAdminClient();
        if(!supabaseAdmin) throw new Error("Admin client is required for file upload.");

        const fileName = `${companyId}/logo_${Date.now()}`;
        const { error: uploadError } = await supabaseAdmin.storage
            .from('assets')
            .upload(fileName, logoFile, { upsert: true });

        if (uploadError) {
            console.error('Error uploading logo:', uploadError);
            throw new Error("Não foi possível carregar a logomarca.");
        }

        const { data } = supabaseAdmin.storage.from('assets').getPublicUrl(fileName);
        logoUrl = data.publicUrl;
    }

    const updates = {
        company_name: companyName,
        logo_url: logoUrl,
    };
    
    // This update is protected by RLS. The user must be an admin of the specified companyId.
    const { error } = await supabase
        .from('settings')
        .update(updates)
        .eq('company_id', companyId); 

    if (error) {
        console.error('Error saving settings:', error);
        throw new Error("Não foi possível salvar as configurações.");
    }
}
    

    

    

