
import type { Client, Project, Visit, Photo, MasterData, VisitsSummary } from './definitions';

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

// --- Data Access Functions ---

export const getClients = (): Client[] => loadData('clients', defaultClients);
export const getClientById = (id: string): Client | undefined => getClients().find(c => c.id === id);

export const getProjects = (): Project[] => loadData('projects', defaultProjects);
export const getProjectById = (id: string): Project | undefined => getProjects().find(p => p.id === id);
export const getProjectsByClientId = (clientId: string): Project[] => getProjects().filter(p => p.clientId === clientId);

export const getVisits = (): Visit[] => loadData('visits', defaultVisits);
export const getVisitById = (id: string): Visit | undefined => getVisits().find(v => v.id === id);
export const getVisitsByClientId = (clientId: string): Visit[] => getVisits().filter(v => v.clientId === clientId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export const getMasterData = () => loadData('masterData', defaultMasterData);


// --- Dashboard Functions ---
export const getTotalRevenue = () => getProjects().reduce((sum, p) => p.paymentStatus === 'pago' ? sum + p.value : sum, 0);
export const getTotalPendingRevenue = () => getProjects().reduce((sum, p) => p.paymentStatus === 'pendente' ? sum + p.value : sum, 0);
export const getActiveProjects = () => getProjects().filter(p => new Date(p.endDate) >= new Date());
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


// --- Data Mutation Functions (used by server actions) ---
export const addClient = (client: Omit<Client, 'id'>) => {
  const clients = getClients();
  const newClient = { ...client, id: String(Date.now()) };
  saveData('clients', [...clients, newClient]);
  return newClient;
};

export const addProject = (project: Omit<Project, 'id' | 'photosBefore' | 'photosAfter'>) => {
  const projects = getProjects();
  const newProject: Project = { ...project, id: `p${Date.now()}`, photosBefore: [], photosAfter: [] };
  saveData('projects', [...projects, newProject]);

  if (project.visitId) {
    const visits = getVisits();
    const visitIndex = visits.findIndex(v => v.id === project.visitId);
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
        return null; // Don't check if essential data is missing
    }
    const allVisits = getVisits();
    const otherClientVisits = allVisits.filter(v => v.clientId === newVisit.clientId && v.id !== newVisit.visitId);
    
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

export const checkForProjectConflict = (newProject: { clientId: string, startDate: string, endDate: string }): Project | null => {
    const allProjects = getProjects();
    const clientProjects = allProjects.filter(p => p.clientId === newProject.clientId);
    const newStart = new Date(newProject.startDate).getTime();
    const newEnd = new Date(newProject.endDate).getTime();

    for(const project of clientProjects) {
        const existingStart = new Date(project.startDate).getTime();
        const existingEnd = new Date(project.endDate).getTime();

        // Check for overlap
        if (newStart <= existingEnd && newEnd >= existingStart) {
            return project;
        }
    }

    return null;
}
