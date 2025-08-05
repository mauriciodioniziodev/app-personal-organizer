

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
        // This is not an error, it just means the user is not logged in.
        return null;
    }
    
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
            id,
            company_id,
            full_name,
            role,
            status,
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
        id: profile.id,
        companyId: profile.company_id,
        fullName: profile.full_name,
        email: session.user.email || '',
        status: profile.status,
        role: profile.role,
        companyName: companyDetails?.trade_name || 'Empresa não encontrada'
    };
}

export const getMyCompanyUsers = async (): Promise<UserProfile[]> => {
    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) throw new Error("Acesso de administrador não configurado.");

    // First, get the current user's profile to know which company to query for
    // This uses the standard client to respect RLS (user can only see their own profile)
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
        console.error("Could not determine current user.");
        return [];
    }

    let profilesQuery;

    // Super admin can see all users
    if (currentProfile.email === 'mauriciodionizio@gmail.com') {
        profilesQuery = supabaseAdmin
            .from('profiles')
            .select(`
                id,
                full_name,
                role,
                status,
                company_id,
                organizations ( trade_name )
            `);
    } else {
        // Regular admins can see users from their own company
        if (!currentProfile.companyId) {
            console.error("Current admin user does not have a company ID.");
            return [];
        }
        profilesQuery = supabaseAdmin
            .from('profiles')
            .select(`
                id,
                full_name,
                role,
                status,
                company_id,
                organizations ( trade_name )
            `)
            .eq('company_id', currentProfile.companyId);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
        console.error("Error fetching profiles with admin client:", profilesError);
        return [];
    }

    // Now, fetch all auth users to map emails (this is a privileged operation)
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
    // This MUST use the admin client as only a superadmin can see all organizations
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
        // Log the error but don't fail the whole operation
        console.error("Error creating settings for new organization:", settingsError);
    }

    return toCamelCase(orgData);
};

export const updateOrganization = async (id: string, updates: Partial<Company>): Promise<Company> => {
    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) throw new Error("Acesso de administrador não configurado.");
    
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
    const profile = await getCurrentProfile();
    if (!profile) return [];

    let query = supabase.from('clients').select('*');
    if (profile.email !== 'mauriciodionizio@gmail.com') {
        if (!profile.companyId) return [];
        query = query.eq('company_id', profile.companyId);
    }
    
    const { data, error } = await query.order('name');
    if (error) {
        console.error("Error fetching clients:", error);
        return [];
    }
    return data.map(c => toCamelCase(c)) as Client[];
};
export const getClientById = async (id: string): Promise<Client | null> => {
    if (!supabase || !id) return null;
    const profile = await getCurrentProfile();
    if (!profile) return null;

    let query = supabase.from('clients').select('*').eq('id', id);

    if (profile.email !== 'mauriciodionizio@gmail.com') {
        if (!profile.companyId) return null;
        query = query.eq('company_id', profile.companyId);
    }

    const { data, error } = await query.single();
    if (error) {
        console.error(`Error fetching client ${id}:`, error);
        return null;
    }
    return toCamelCase(data) as Client;
};

export const getProjects = async (): Promise<Project[]> => {
    if (!supabase) return [];
    const profile = await getCurrentProfile();
    if (!profile) return [];

    let projectsQuery = supabase.from('projects').select('*');
    if (profile.email !== 'mauriciodionizio@gmail.com') {
         if (!profile.companyId) return [];
        projectsQuery = projectsQuery.eq('company_id', profile.companyId);
    }

    const { data: projectsData, error: projectsError } = await projectsQuery.order('start_date', { ascending: false });
    if (projectsError) {
        console.error("Error fetching projects:", projectsError);
        return [];
    }

    const projectIds = projectsData.map(p => p.id);
    if(projectIds.length === 0) return [];
    
    const { data: paymentsData, error: paymentsError } = await supabase.from('payments').select('*').in('project_id', projectIds);
     if (paymentsError) {
        console.error("Error fetching payments:", paymentsError);
        return projectsData.map(p_raw => projectFromSupabase(p_raw, []));
    }

    return projectsData.map(p_raw => projectFromSupabase(p_raw, paymentsData || []));
};

export const getProjectById = async (id: string): Promise<Project | null> => {
    if (!supabase || !id) return null;
    const profile = await getCurrentProfile();
    if (!profile) return null;

    let query = supabase.from('projects').select('*').eq('id', id);
    if (profile.email !== 'mauriciodionizio@gmail.com') {
        if (!profile.companyId) return null;
        query = query.eq('company_id', profile.companyId);
    }

    const { data: projectData, error: projectError } = await query.single();
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
    const profile = await getCurrentProfile();
    if (!profile) return [];
    
    let query = supabase.from('visits').select('*');
    if (profile.email !== 'mauriciodionizio@gmail.com') {
        if (!profile.companyId) return [];
        query = query.eq('company_id', profile.companyId);
    }

    const { data, error } = await query.order('date', { ascending: false });
    if (error) {
        console.error("Error fetching visits:", error);
        return [];
    }
    return toCamelCase(data) as Visit[];
};

export const getVisitById = async (id: string): Promise<Visit | null> => {
    if (!supabase || !id) return null;
    const profile = await getCurrentProfile();
    if (!profile) return null;

    let query = supabase.from('visits').select('*').eq('id', id);
    if (profile.email !== 'mauriciodionizio@gmail.com') {
        if (!profile.companyId) return null;
        query = query.eq('company_id', profile.companyId);
    }

    const { data, error } = await query.single();
    if (error) {
        console.error(`Error fetching visit ${id}:`, error);
        return null;
    }
    return toCamelCase(data) as Visit;
}


// --- Dashboard-specific data functions ---

export const getActiveProjects = async (): Promise<Project[]> => {
    if (!supabase) return [];
    const profile = await getCurrentProfile();
    if (!profile) return [];
    
    let query = supabase
        .from('projects')
        .select('*')
        .in('status', ['Em andamento', 'A iniciar', 'Pausado', 'Atrasado'])
        .gte('end_date', new Date().toISOString());

    if (profile.email !== 'mauriciodionizio@gmail.com') {
        if (!profile.companyId) return [];
        query = query.eq('company_id', profile.companyId);
    }

    const { data: projectsData, error: projectsError } = await query.order('end_date', { ascending: true });
        
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
    const profile = await getCurrentProfile();
    if (!profile) return [];

    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 7);
    
    let query = supabase
        .from('visits')
        .select('*')
        .gte('date', today.toISOString())
        .lte('date', future.toISOString());

    if (profile.email !== 'mauriciodionizio@gmail.com') {
        if (!profile.companyId) return [];
        query = query.eq('company_id', profile.companyId);
    }

    const { data, error } = await query.order('date', { ascending: true });
        
    if (error) {
        console.error("Error fetching upcoming visits:", error);
        return [];
    }
    return toCamelCase(data) as Visit[];
};

export const getVisitsSummary = async (): Promise<VisitsSummary> => {
    if (!supabase) return {};
    const profile = await getCurrentProfile();
    if (!profile) return {};

    let query = supabase.from('visits').select('status');
    if (profile.email !== 'mauriciodionizio@gmail.com') {
        if (!profile.companyId) return {};
        query = query.eq('company_id', profile.companyId);
    }
    
    const { data, error } = await query;
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
    const profile = await getCurrentProfile();
    if (!profile) return [];

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    // As `date` in Supabase is `timestamp with time zone`, we can query it directly.
    // The database will correctly handle the comparison with the provided ISO strings.
    let visitsQuery = supabase.from('visits').select('*')
        .gte('date', startOfDay.toISOString())
        .lte('date', endOfDay.toISOString());
    
    let projectsQuery = supabase.from('projects').select('*')
        .lt('start_date', endOfDay.toISOString()) // Project has started
        .gt('end_date', startOfDay.toISOString()) // And has not yet ended
        .in('status', ['Em andamento', 'Atrasado']); // And is in a relevant status

    if (profile.email !== 'mauriciodionizio@gmail.com') {
        if (!profile.companyId) return [];
        visitsQuery = visitsQuery.eq('company_id', profile.companyId);
        projectsQuery = projectsQuery.eq('company_id', profile.companyId);
    }

    const [
        { data: visitsData, error: visitsError },
        { data: projectsData, error: projectsError },
        clients
    ] = await Promise.all([
        visitsQuery,
        projectsQuery,
        getClients()
    ]);

    if (visitsError) console.error("Error fetching today's visits:", visitsError);
    if (projectsError) console.error("Error fetching today's projects:", projectsError);

    const clientMap = new Map(clients.map(c => [c.id, c]));

    const schedule: ScheduleItem[] = [];

    (visitsData || []).forEach(v => {
        const client = clientMap.get(v.client_id);
        const visitDate = new Date(v.date);
        
        if (client) {
            schedule.push({
                id: `visit-${v.id}`,
                type: 'visit',
                date: v.date,
                time: visitDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                title: 'Visita Agendada',
                clientName: client.name,
                clientId: client.id,
                status: v.status,
                path: `/visits/${v.id}`,
                clientPhone: client.phone,
                clientAddress: client.address,
                isOverdue: visitDate.getTime() < now.getTime() && v.status === 'pendente'
            });
        }
    });
    
     (projectsData || []).forEach(p => {
        const client = clientMap.get(p.client_id);
        const projectEndDate = new Date(p.end_date);
        projectEndDate.setHours(23, 59, 59, 999);
        const isOverdue = projectEndDate.getTime() < now.getTime() && !['Concluído', 'Cancelado'].includes(p.status);

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
    const profile = await getCurrentProfile();
    if (!profile) return 0;

    let query = supabase
        .from('payments')
        .select('amount, projects!inner(company_id)')
        .eq('status', 'pago');
    
    if (profile.email !== 'mauriciodionizio@gmail.com') {
        if (!profile.companyId) return 0;
        query = query.eq('projects.company_id', profile.companyId);
    }
    
    if (startDate) {
        query = query.gte('due_date', startDate);
    }
    if (endDate) {
        query = query.lte('due_date', endDate);
    }

    const { data, error } = await query;
    
    if (error) {
        console.error("Error fetching total revenue from payments:", error.message);
        return 0;
    }

    return data.reduce((sum, payment) => sum + payment.amount, 0);
};

export const getTotalPendingRevenue = async ({ startDate, endDate }: { startDate?: string, endDate?: string } = {}): Promise<number> => {
    if (!supabase) return 0;
    const profile = await getCurrentProfile();
    if (!profile) return 0;
    
    const now = new Date().toISOString();

    let query = supabase
        .from('payments')
        .select('amount, projects!inner(company_id)')
        .eq('status', 'pendente');

    if (profile.email !== 'mauriciodionizio@gmail.com') {
        if (!profile.companyId) return 0;
        query = query.eq('projects.company_id', profile.companyId);
    }

    if (startDate) {
        query = query.gte('due_date', startDate);
    }
    if (endDate) {
        query = query.lte('due_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching pending revenue from payments:", error.message);
        return 0;
    }
    
    return data.reduce((sum, payment) => sum + payment.amount, 0);
};


export const getProjectsByClientId = async (clientId: string): Promise<Project[]> => {
    if(!supabase || !clientId) return [];
    const profile = await getCurrentProfile();
    if (!profile) return [];
    
    let query = supabase.from('projects').select('*').eq('client_id', clientId);

    if (profile.email !== 'mauriciodionizio@gmail.com') {
        if (!profile.companyId) return [];
        query = query.eq('company_id', profile.companyId);
    }

    const { data, error } = await query;

    if(error) {
        console.error("Error fetching projects by client:", error);
        return [];
    }
    
    const projectIds = data.map(p => p.id);
    if(projectIds.length === 0) return data.map(p => projectFromSupabase(p, []));
    
    const { data: paymentsData, error: paymentsError } = await supabase.from('payments').select('*').in('project_id', projectIds);
     if (paymentsError) {
        return data.map(p_raw => projectFromSupabase(p_raw, []));
    }
    
    return data.map(p_raw => projectFromSupabase(p_raw, paymentsData || []));
};

export const getVisitsByClientId = async (clientId: string): Promise<Visit[]> => {
    if(!supabase || !clientId) return [];
    const profile = await getCurrentProfile();
    if (!profile) return [];
    
    let query = supabase.from('visits').select('*').eq('client_id', clientId);

    if (profile.email !== 'mauriciodionizio@gmail.com') {
        if (!profile.companyId) return [];
        query = query.eq('company_id', profile.companyId);
    }

    const { data, error } = await query.order('date', {ascending: false});
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
        .select('id, summary, date')
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

    return data && data.length > 0 ? toCamelCase(data[0]) : null;
}

export const checkForProjectConflict = async ({clientId, startDate, endDate, projectId}: {clientId: string, startDate: string, endDate: string, projectId?: string}) => {
     if(!supabase || !clientId || !startDate || !endDate) return null;
     
     let query = supabase.from('projects')
        .select('id, name, start_date, end_date')
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
    if (!profile || !profile.companyId) throw new Error("Usuário não autenticado.");

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

export const updateClient = async (client: Client): Promise<Client> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    
    const { id, createdAt, companyId, ...updateData } = client;

    const { data, error } = await supabase
        .from('clients')
        .update(toSnakeCase(updateData))
        .eq('id', id)
        .select()
        .single();
        
    if (error) {
        console.error("Error updating client:", error);
        throw new Error("Não foi possível atualizar o cliente.");
    }
    return toCamelCase(data);
}

export const addVisit = async (visit: Omit<Visit, 'id' | 'createdAt' | 'photos' | 'projectId' | 'companyId' | 'budgetAmount' | 'budgetPdfUrl'>): Promise<Visit> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const profile = await getCurrentProfile();
    if (!profile || !profile.companyId) throw new Error("Usuário não autenticado.");
    
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


export const addProject = async (project: Omit<Project, 'id' | 'paymentStatus' | 'companyId' | 'createdAt'>): Promise<Project> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const profile = await getCurrentProfile();
    if (!profile || !profile.companyId) throw new Error("Usuário não autenticado.");

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
    
    // First, delete existing payments for the project to handle cases where payment structure changes (e.g., vista to parcelado)
    const { error: deleteError } = await supabase.from('payments').delete().eq('project_id', project.id);
    if (deleteError) {
        console.error("Error deleting old payments:", deleteError);
        throw new Error("Não foi possível atualizar as parcelas do projeto.");
    }

    // Now, insert the new/updated payments
    if (payments && payments.length > 0) {
        const paymentsToInsert = payments.map(p => ({
            project_id: project.id,
            amount: p.amount,
            status: p.status,
            due_date: p.dueDate,
            description: p.description,
            // We need to decide if we keep the old id or generate new ones. 
            // For simplicity in upsert-like logic, let's treat them as new if the structure can change.
            // However, if we want to preserve payment history, a more complex update logic is needed.
            // For now, let's re-insert.
        }));
        const { error: insertError } = await supabase.from('payments').insert(paymentsToInsert);

        if (insertError) {
            console.error("Error inserting new payments:", insertError);
            throw new Error("Não foi possível salvar as novas parcelas do projeto.");
        }
    }
    
    const { data: finalPayments } = await supabase.from('payments').select('*').eq('project_id', updatedProjectData.id);
    
    return projectFromSupabase(updatedProjectData, finalPayments || []);
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

// Master data is global, so it doesn't need company_id filtering.
const getMasterData = async (tableName: string): Promise<MasterDataItem[]> => {
    if (!supabase) return [];
    
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return [];
    }
    return data;
}

const addMasterDataItem = async (tableName: string, name: string): Promise<MasterDataItem> => {
    const profile = await getCurrentProfile();
    if (profile?.email !== 'mauriciodionizio@gmail.com') {
        throw new Error("Apenas o superadministrador pode adicionar novos itens.");
    }
    if (!supabase) throw new Error("Supabase client not initialized.");

    // company_id is no longer added, as this is global data.
    const { data, error } = await supabase.from(tableName).insert({ name }).select().single();
    if (error) {
        console.error(`Error adding item to ${tableName}:`, error);
        throw new Error("Não foi possível adicionar a opção.");
    }
    return data;
};

const deleteMasterDataItem = async (tableName: string, id: string): Promise<void> => {
    const profile = await getCurrentProfile();
    if (profile?.email !== 'mauriciodionizio@gmail.com') {
        throw new Error("Apenas o superadministrador pode remover itens.");
    }
    if (!supabase) throw new Error("Supabase client not initialized.");
    
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
        console.error(`Error deleting item from ${tableName}:`, error);
        throw new Error("Não foi possível remover a opção.");
    }
};


export const getVisitStatusOptions = async (): Promise<MasterDataItem[]> => {
    return getMasterData('master_visit_status');
}

export const addVisitStatusOption = async (name: string): Promise<MasterDataItem> => {
    return addMasterDataItem('master_visit_status', name);
}

export const deleteVisitStatusOption = async (id: string): Promise<void> => {
    return deleteMasterDataItem('master_visit_status', id);
}

export const getPaymentInstrumentsOptions = async (): Promise<MasterDataItem[]> => {
    return getMasterData('master_payment_instruments');
}

export const addPaymentInstrumentOption = async (name: string): Promise<MasterDataItem> => {
    return addMasterDataItem('master_payment_instruments', name);
}

export const deletePaymentInstrumentOption = async (id: string): Promise<void> => {
    return deleteMasterDataItem('master_payment_instruments', id);
}

export const getProjectStatusOptions = async (): Promise<MasterDataItem[]> => {
    return getMasterData('master_project_status');
}

export const addProjectStatusOption = async (name: string): Promise<MasterDataItem> => {
    return addMasterDataItem('master_project_status', name);
}

export const deleteProjectStatusOption = async (id: string): Promise<void> => {
    return deleteMasterDataItem('master_project_status', id);
}

// --- Company Settings Functions ---

export const getSettings = async (companyId: string): Promise<CompanySettings | null> => {
    if (!supabase) return null;
    if (!companyId) {
        console.error("getSettings requires a companyId.");
        return null;
    }

    const { data: settingsData, error } = await supabase
        .from('settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

    if (error) {
        console.error("Error fetching settings:", error);
        return null;
    }

    // This handles the case where a company exists but has no settings row yet.
    if (!settingsData) {
        const supabaseAdmin = createSupabaseAdminClient();
        if (!supabaseAdmin) {
            console.error("Admin client is required to create missing settings.");
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
    }
    
    return toCamelCase(settingsData);
};


export const updateSettings = async ({ companyId, companyName, logoFile }: { companyId: string, companyName: string, logoFile: File | null }): Promise<void> => {
     if (!supabase) throw new Error("Supabase client not initialized.");
     if (!companyId) throw new Error("Company ID is required to update settings.");

    const { data: currentSettings, error: fetchError } = await supabase.from('settings').select('logo_url').eq('company_id', companyId).single();

    if(fetchError && fetchError.code !== 'PGRST116') { // Ignore "exact one row" error if settings don't exist yet
        console.error('Error fetching current settings:', fetchError);
        throw new Error("Não foi possível buscar as configurações atuais.");
    }


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
        company_id: companyId,
        company_name: companyName,
        logo_url: logoUrl,
    };
    
    const { error } = await supabase
        .from('settings')
        .upsert(updates, { onConflict: 'company_id'})
        .eq('company_id', companyId); 

    if (error) {
        console.error('Error saving settings:', error);
        throw new Error("Não foi possível salvar as configurações.");
    }
}
    

    

    




    







