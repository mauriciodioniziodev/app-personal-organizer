import type { Client, Project, Visit, Photo, MasterData } from './definitions';

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

const defaultClients: Client[] = [
  {
    id: '1',
    name: 'Ana Silva',
    phone: '11 98765-4321',
    email: 'ana.silva@example.com',
    address: 'Rua das Flores, 123, São Paulo, SP',
    preferences: 'Prefere tons neutros e organização minimalista. Gosta de soluções práticas e de fácil manutenção. Cliente mencionou ter alergia a poeira, importante focar em soluções de armazenamento fechadas.',
  },
];

const defaultVisits: Visit[] = [
  { 
    id: 'v1', 
    clientId: '1', 
    projectId: 'p1', 
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
    status: 'realizada', 
    summary: 'Primeira conversa e avaliação do espaço.',
    photos: [] 
  },
  { 
    id: 'v2', 
    clientId: '1', 
    projectId: '', 
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), 
    status: 'pendente', 
    summary: 'Implementação da organização.',
    photos: [] 
  },
   { 
    id: 'v3', 
    clientId: '1', 
    projectId: '', 
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), 
    status: 'pendente', 
    summary: 'Planejamento do home office.',
    photos: [] 
  },
];


const defaultProjects: Project[] = [
  {
    id: 'p1',
    clientId: '1',
    visitId: 'v1',
    name: 'Organização do Closet Principal',
    description: 'Reorganização completa do closet do quarto principal, incluindo categorização de roupas e acessórios.',
    startDate: '2024-07-01',
    endDate: '2024-07-15',
    value: 1500,
    paymentStatus: 'pago',
  },
];


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
export const getVisitsByClientId = (clientId: string): Visit[] => getVisits().filter(v => v.clientId === clientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const getMasterData = () => loadData('masterData', defaultMasterData);


// --- Dashboard Functions ---
export const getTotalRevenue = () => getProjects().reduce((sum, p) => p.paymentStatus === 'pago' ? sum + p.value : sum, 0);
export const getActiveProjects = () => getProjects().filter(p => new Date(p.endDate) >= new Date());
export const getUpcomingVisits = () => {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return getVisits().filter(v => {
        const visitDate = new Date(v.date);
        return visitDate >= now && visitDate <= oneWeekFromNow && v.status === 'pendente';
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// --- Data Mutation Functions (used by server actions) ---
export const addClient = (client: Omit<Client, 'id'>) => {
  const clients = getClients();
  const newClient = { ...client, id: String(Date.now()) };
  saveData('clients', [...clients, newClient]);
  return newClient;
};

export const addProject = (project: Omit<Project, 'id'>) => {
  const projects = getProjects();
  const newProject = { ...project, id: `p${Date.now()}` };
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

export const addPhotoToVisit = (photoData: Omit<Photo, 'id'> & { visitId: string }) => {
    const visits = getVisits();
    const visitIndex = visits.findIndex(v => v.id === photoData.visitId);
    if (visitIndex === -1) {
        throw new Error("Visita não encontrada");
    }
    const newPhoto = { ...photoData, id: `ph${Date.now()}` };
    visits[visitIndex].photos.push(newPhoto);
    saveData('visits', visits);
    return newPhoto;
}


export const updateMasterData = (data: MasterData) => {
    saveData('masterData', data);
    return data;
}
