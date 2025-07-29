

export type Client = {
  id: string;
  name: string;
  phone: string;
  email:string;
  address: string;
  preferences: string;
};

export type Project = {
  id: string;
  clientId: string;
  visitId: string; // Projeto pode ser originado de uma visita
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  value: number;
  paymentStatus: string;
  photosBefore: Photo[];
  photosAfter: Photo[];
};

export type Visit = {
  id: string;
  clientId: string; // Visita pertence a um cliente
  projectId: string; // Projeto associado (pode ser vazio inicialmente)
  date: string;
  status: string;
  summary: string;
  photos: Photo[];
  budgetAmount?: number;
  budgetPdfUrl?: string;
};

export type Photo = {
  id: string;
  type: 'upload' | 'camera'; // Origem da foto
  url: string; // pode ser uma URL http ou um data URL base64
  description: string;
};

export type MasterData = {
  paymentStatus: string[];
  visitStatus: string[];
  photoTypes: string[];
};

export type VisitsSummary = {
  [status: string]: number;
};

export type ScheduleItem = {
    id: string;
    type: 'visit' | 'project';
    date: string; 
    time?: string;
    title: string;
    clientName: string;
    clientId: string;
    status: string;
    path: string;
    clientPhone?: string;
    clientAddress?: string;
    projectStartDate?: string;
    projectEndDate?: string;
};
