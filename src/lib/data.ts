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

const defaultProjects: Project[] = [
  {
    id: 'p1',
    clientId: '1',
    name: 'Organização do Closet Principal',
    description: 'Reorganização completa do closet do quarto principal, incluindo categorização de roupas e acessórios.',
    startDate: '2024-07-01',
    endDate: '2024-07-15',
    value: 1500,
    paymentStatus: 'pago',
  },
  {
    id: 'p2',
    clientId: '1',
    name: 'Projeto Home Office',
    description: 'Criação de um sistema de organização para o home office, otimizando o espaço e a produtividade.',
    startDate: '2024-08-01',
    endDate: '2024-08-10',
    value: 1200,
    paymentStatus: 'pendente',
  },
];

const defaultVisits: Visit[] = [
  { id: 'v1', projectId: 'p1', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'realizada', summary: 'Primeira conversa e avaliação do espaço.' },
  { id: 'v2', projectId: 'p1', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'pendente', summary: 'Implementação da organização.' },
  { id: 'v3', projectId: 'p2', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'pendente', summary: 'Planejamento do home office.' },
];

const defaultPhotos: Photo[] = [
    {id: 'ph1', projectId: 'p1', type: 'antes', url: 'https://placehold.co/600x400', description: 'Closet antes da organização'},
    {id: 'ph2', projectId: 'p1', type: 'depois', url: 'https://placehold.co/600x400', description: 'Closet após a organização'},
];

const defaultMasterData: MasterData = {
    paymentStatus: ['pendente', 'pago'],
    visitStatus: ['pendente', 'realizada', 'cancelada'],
    photoTypes: ['antes', 'depois'],
}

// --- Data Access Functions ---

export const getClients = () => loadData('clients', defaultClients);
export const getClientById = (id: string) => getClients().find(c => c.id === id);

export const getProjects = () => loadData('projects', defaultProjects);
export const getProjectById = (id: string) => getProjects().find(p => p.id === id);
export const getProjectsByClientId = (clientId: string) => getProjects().filter(p => p.clientId === clientId);

export const getVisits = () => loadData('visits', defaultVisits);
export const getVisitsByProjectId = (projectId: string) => getVisits().filter(v => v.projectId === projectId).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
export const getPhotosByProjectId = (projectId: string) => loadData('photos', defaultPhotos).filter(p => p.projectId === projectId);

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
  clients.push(newClient);
  saveData('clients', clients);
  return newClient;
};

export const addProject = (project: Omit<Project, 'id'>) => {
  const projects = getProjects();
  const newProject = { ...project, id: `p${Date.now()}` };
  projects.push(newProject);
  saveData('projects', projects);
  return newProject;
};

export const addVisit = (visit: Omit<Visit, 'id'>) => {
    const visits = getVisits();
    const newVisit = { ...visit, id: `v${Date.now()}` };
    visits.push(newVisit);
    saveData('visits', visits);
    return newVisit;
}

export const addPhoto = (photo: Omit<Photo, 'id'>) => {
    const photos = getPhotosByProjectId(photo.projectId);
    const newPhoto = { ...photo, id: `ph${Date.now()}` };
    photos.push(newPhoto);
    saveData('photos', photos);
    return newPhoto;
}

export const updateMasterData = (data: MasterData) => {
    saveData('masterData', data);
    return data;
}
