import type { Client, Project, Visit, Photo } from './definitions';

let clients: Client[] = [
  {
    id: '1',
    name: 'Ana Silva',
    phone: '11 98765-4321',
    email: 'ana.silva@example.com',
    address: 'Rua das Flores, 123, São Paulo, SP',
    preferences: 'Prefere tons neutros e organização minimalista. Gosta de soluções práticas e de fácil manutenção. Cliente mencionou ter alergia a poeira, importante focar em soluções de armazenamento fechadas.',
  },
];

let projects: Project[] = [
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

let visits: Visit[] = [
  { id: 'v1', projectId: 'p1', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'realizada', summary: 'Primeira conversa e avaliação do espaço.' },
  { id: 'v2', projectId: 'p1', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'pendente', summary: 'Implementação da organização.' },
  { id: 'v3', projectId: 'p2', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'pendente', summary: 'Planejamento do home office.' },
];

let photos: Photo[] = [
    {id: 'ph1', projectId: 'p1', type: 'antes', url: 'https://placehold.co/600x400', description: 'Closet antes da organização'},
    {id: 'ph2', projectId: 'p1', type: 'depois', url: 'https://placehold.co/600x400', description: 'Closet após a organização'},
];

// Data access functions
export const getClients = () => clients;
export const getClientById = (id: string) => clients.find(c => c.id === id);

export const getProjects = () => projects;
export const getProjectById = (id: string) => projects.find(p => p.id === id);
export const getProjectsByClientId = (clientId: string) => projects.filter(p => p.clientId === clientId);

export const getVisitsByProjectId = (projectId: string) => visits.filter(v => v.projectId === projectId).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
export const getPhotosByProjectId = (projectId: string) => photos.filter(p => p.projectId === projectId);


// Dashboard functions
export const getTotalRevenue = () => projects.reduce((sum, p) => p.paymentStatus === 'pago' ? sum + p.value : sum, 0);
export const getActiveProjects = () => projects.filter(p => new Date(p.endDate) >= new Date());
export const getUpcomingVisits = () => {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return visits.filter(v => {
        const visitDate = new Date(v.date);
        return visitDate >= now && visitDate <= oneWeekFromNow && v.status === 'pendente';
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Data mutation functions (used by server actions)
export const addClient = (client: Omit<Client, 'id'>) => {
  const newClient = { ...client, id: String(Date.now()) };
  clients.push(newClient);
  return newClient;
};

export const addProject = (project: Omit<Project, 'id'>) => {
  const newProject = { ...project, id: `p${Date.now()}` };
  projects.push(newProject);
  return newProject;
};

export const addVisit = (visit: Omit<Visit, 'id'>) => {
    const newVisit = { ...visit, id: `v${Date.now()}` };
    visits.push(newVisit);
    return newVisit;
}

export const addPhoto = (photo: Omit<Photo, 'id'>) => {
    const newPhoto = { ...photo, id: `ph${Date.now()}` };
    photos.push(newPhoto);
    return newPhoto;
}
