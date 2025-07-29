

import type { Client, Project, Visit, Photo, MasterData, VisitsSummary, ScheduleItem, Payment } from './definitions';
import { v4 as uuidv4 } from 'uuid';

// --- Data Persistence Layer (using localStorage) ---

const isServer = typeof window === 'undefined';

function saveData<T>(key: string, data: T) {
  if (isServer) return;
  localStorage.setItem(key, JSON.stringify(data));
}

function loadData<T>(key: string, defaultValue: T): T {
  if (isServer) return defaultValue;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(`Error parsing localStorage data for key "${key}"`, e);
      return defaultValue;
    }
  }
  return defaultValue;
}


// --- Initial/Default Data ---

const defaultClients: Client[] = [];
const defaultVisits: Visit[] = [];
const defaultProjects: Project[] = [];


const defaultMasterData: MasterData = {
    paymentStatus: ['pendente', 'pago'],
    visitStatus: ['pendente', 'realizada', 'cancelada', 'orçamento'],
    photoTypes: ['ambiente', 'detalhe', 'inspiração'],
}

// --- Helper Functions ---
const getProjectPaymentStatus = (project: Project): string => {
    if (!project.payments || project.payments.length === 0) {
        return 'pendente';
    }
    const paidCount = project.payments.filter(p => p.status === 'pago').length;
    if (paidCount === 0) return 'pendente';
    if (paidCount === project.payments.length) return 'pago';
    return 'parcialmente pago';
}


// --- Data Access Functions ---

export const getClients = (): Client[] => loadData('clients', defaultClients);
export const getClientById = (id: string): Client | undefined => getClients().find(c => c.id === id);

export const getProjects = (): Project[] => {
    const projects = loadData<Project[]>('projects', defaultProjects);
    // Data migration for old projects without the payments array
    return projects.map(p => {
        if (!p.payments) {
            console.warn(`Project with id ${p.id} is missing payments array. Migrating...`);
            const payment: Payment = {
                id: uuidv4(),
                amount: p.value,
                status: (p as any).paymentStatus === 'pago' ? 'pago' : 'pendente',
                dueDate: p.endDate,
                description: "Pagamento Único"
            };
            p.payments = [payment];
            p.paymentMethod = 'vista';
        }
        return { ...p, paymentStatus: getProjectPaymentStatus(p) }
    });
};
export const getProjectById = (id: string): Project | undefined => getProjects().find(p => p.id === id);
export const getProjectsByClientId = (clientId: string): Project[] => getProjects().filter(p => p.clientId === clientId);

export const getVisits = (): Visit[] => loadData('visits', defaultVisits);
export const getVisitById = (id: string): Visit | undefined => getVisits().find(v => v.id === id);
export const getVisitsByClientId = (clientId: string): Visit[] => getVisits().filter(v => v.clientId === clientId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export const getMasterData = () => loadData('masterData', defaultMasterData);


// --- Dashboard Functions ---
export const getTotalRevenue = () => getProjects().flatMap(p => p.payments).reduce((sum, payment) => payment.status === 'pago' ? sum + payment.amount : sum, 0);
export const getTotalPendingRevenue = () => getProjects().flatMap(p => p.payments).reduce((sum, payment) => payment.status === 'pendente' ? sum + payment.amount : sum, 0);
export const getActiveProjects = () => getProjects().filter(p => new Date(p.endDate) >= new Date() && p.paymentStatus !== 'pago');
export const getUpcomingVisits = () => {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return getVisits().filter(v => {
        const visitDate = new Date(v.date);
        return visitDate >= now && visitDate <= oneWeekFromNow && v.status === 'pendente';
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
export const getVisitsSummary = (): VisitsSummary => {
    const visits = getVisits();
    return visits.reduce((acc, visit) => {
        acc[visit.status] = (acc[visit.status] || 0) + 1;
        return acc;
    }, {} as VisitsSummary);
};

export const getTodaysSchedule = (): ScheduleItem[] => {
    const clients = getClients();
    const getClient = (clientId: string) => clients.find(c => c.id === clientId);

    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayVisits = getVisits().filter(v => {
        const visitDate = new Date(v.date);
        return visitDate >= startOfDay && visitDate <= endOfDay;
    });
    
    const todayProjects = getProjects().filter(p => {
        const startDate = new Date(`${p.startDate}T00:00:00`);
        const endDate = new Date(`${p.endDate}T23:59:59`);
        return startOfDay <= endDate && endOfDay >= startDate;
    });

    const schedule: ScheduleItem[] = [];

    todayVisits.forEach(v => {
        const client = getClient(v.clientId);
        const visitDate = new Date(v.date);
        schedule.push({
            id: v.id,
            type: 'visit',
            date: v.date,
            time: visitDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            title: `Visita`,
            clientName: client?.name ?? 'Cliente desconhecido',
            clientId: v.clientId,
            clientPhone: client?.phone,
            clientAddress: client?.address,
            status: v.status,
            path: `/visits/${v.id}`,
            isOverdue: v.status === 'pendente' && now > visitDate,
        });
    });

     todayProjects.forEach(p => {
        const client = getClient(p.clientId);
        schedule.push({
            id: p.id,
            type: 'project',
            date: p.startDate, // Using start date for sorting consistency
            title: p.name,
            clientName: client?.name ?? 'Cliente desconhecido',
            clientId: p.clientId,
            clientPhone: client?.phone,
            clientAddress: client?.address,
            projectStartDate: p.startDate,
            projectEndDate: p.endDate,
            status: p.paymentStatus,
            path: `/projects/${p.id}`
        });
    });

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
export const addClient = (client: Omit<Client, 'id'>) => {
  const clients = getClients();
  const newClient = { ...client, id: String(Date.now()) };
  saveData('clients', [...clients, newClient]);
  return newClient;
};

export const addProject = (projectData: Omit<Project, 'id' | 'photosBefore' | 'photosAfter' | 'paymentStatus'>) => {
  const projects = getProjects();
  const newProject: Project = { 
      ...projectData, 
      id: `p${Date.now()}`,
      photosBefore: [],
      photosAfter: [],
      paymentStatus: 'pendente' // Initial status
  };
  
  newProject.paymentStatus = getProjectPaymentStatus(newProject);
  
  saveData('projects', [...projects, newProject]);

  if (projectData.visitId) {
    const visits = getVisits();
    const visitIndex = visits.findIndex(v => v.id === projectData.visitId);
    if(visitIndex !== -1) {
      visits[visitIndex].projectId = newProject.id;
      saveData('visits', visits);
    }
  }

  return newProject;
};

export const updateProject = (project: Project) => {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if(index === -1) throw new Error("Project not found");
    
    // Recalculate payment status before saving
    project.paymentStatus = getProjectPaymentStatus(project);
    projects[index] = project;
    
    saveData('projects', projects);
    return project;
}


export const createVisitFromClient = (visit: Omit<Visit, 'id' | 'photos' | 'projectId'>) => {
  const visits = getVisits();
  const newVisit = { ...visit, id: `v${Date.now()}`, photos: [], projectId: '' };
  saveData('visits', [...visits, newVisit]);
  return newVisit;
}


export const addVisit = (visit: Omit<Visit, 'id' | 'photos' | 'projectId' >) => {
    const visits = getVisits();
    const newVisit: Visit = { ...visit, id: `v${Date.now()}`, photos: [], projectId: '' };
    saveData('visits', [...visits, newVisit]);
    return newVisit;
}

export const updateVisit = (visit: Visit) => {
    const visits = getVisits();
    const index = visits.findIndex(v => v.id === visit.id);
    if (index === -1) {
        throw new Error("Visita não encontrada");
    }
    visits[index] = visit;
    saveData('visits', visits);
    return visit;
};

export const addPhotoToVisit = (photoData: Omit<Photo, 'id'> & { visitId: string }) => {
    const visits = getVisits();
    const visitIndex = visits.findIndex(v => v.id === photoData.visitId);
    if (visitIndex === -1) {
        throw new Error("Visita não encontrada");
    }
    const newPhoto = { ...photoData, id: `ph${Date.now()}` };
    if (!visits[visitIndex].photos) {
        visits[visitIndex].photos = [];
    }
    visits[visitIndex].photos.push(newPhoto);
    saveData('visits', visits);
    return newPhoto;
}

export const addPhotoToProject = (
    projectId: string, 
    photoType: 'before' | 'after', 
    photoData: Omit<Photo, 'id'>
) => {
    const projects = getProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
        throw new Error("Projeto não encontrado");
    }

    // Ensure photosBefore and photosAfter arrays exist
    if (!projects[projectIndex].photosBefore) {
        projects[projectIndex].photosBefore = [];
    }
    if (!projects[projectIndex].photosAfter) {
        projects[projectIndex].photosAfter = [];
    }
    
    const newPhoto = { ...photoData, id: `ph${Date.now()}` };
    if (photoType === 'before') {
        projects[projectIndex].photosBefore.push(newPhoto);
    } else {
        projects[projectIndex].photosAfter.push(newPhoto);
    }
    saveData('projects', projects);
    return projects[projectIndex];
}

export const addBudgetToVisit = (visitId: string, budgetAmount: number, budgetPdfUrl: string) => {
    const visits = getVisits();
    const visitIndex = visits.findIndex(v => v.id === visitId);
    if (visitIndex === -1) {
        throw new Error("Visita não encontrada");
    }
    visits[visitIndex].budgetAmount = budgetAmount;
    visits[visitIndex].budgetPdfUrl = budgetPdfUrl;
    saveData('visits', visits);
    return visits[visitIndex];
}


export const updateMasterData = (data: MasterData) => {
    saveData('masterData', data);
    return data;
}

export const checkForVisitConflict = (newVisit: { clientId: string, date: string, visitId?: string }): Visit | null => {
    if (!newVisit.clientId || !newVisit.date) {
        return null;
    }
    
    const allVisits = getVisits();
    
    const otherClientVisits = allVisits.filter(v => {
        return v.clientId === newVisit.clientId && v.id !== newVisit.visitId;
    });
    
    if (otherClientVisits.length === 0) {
        return null;
    }

    const newVisitTime = new Date(newVisit.date).getTime();
    const fourHours = 4 * 60 * 60 * 1000;

    for (const visit of otherClientVisits) {
        const existingVisitTime = new Date(visit.date).getTime();
        if (Math.abs(newVisitTime - existingVisitTime) < fourHours) {
            return visit; 
        }
    }
    
    return null;
}

export const checkForProjectConflict = (newProject: { clientId: string, startDate: string, endDate: string, projectId?: string }): Project | null => {
    const allProjects = getProjects();
    const clientProjects = allProjects.filter(p => p.clientId === newProject.clientId && p.id !== newProject.projectId);
    const newStart = new Date(newProject.startDate).getTime();
    const newEnd = new Date(newProject.endDate).getTime();

    for(const project of clientProjects) {
        const existingStart = new Date(project.startDate).getTime();
        const existingEnd = new Date(project.endDate).getTime();

        if (newStart <= existingEnd && newEnd >= existingStart) {
            return project;
        }
    }

    return null;
}
