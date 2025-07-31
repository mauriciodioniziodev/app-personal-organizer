

export type Client = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email:string;
  address: string;
  preferences: string;
  cpf: string;
  birthday: string;
};

export type Payment = {
  id: string;
  created_at: string;
  project_id: string;
  amount: number;
  status: 'pendente' | 'pago';
  dueDate: string;
  description: string;
}

export type Project = {
  id: string;
  created_at: string;
  clientId: string;
  visitId: string; // Projeto pode ser originado de uma visita
  name: string;
  description: string;
  status: string; // 'A iniciar', 'Em andamento', 'Pausado', 'Atrasado', 'Concluído', 'Cancelado'
  startDate: string;
  endDate: string;
  value: number; // Valor original
  discountPercentage: number;
  discountAmount: number;
  finalValue: number; // Valor com desconto
  paymentMethod: 'vista' | 'parcelado';
  paymentInstrument: string;
  paymentStatus: string; // 'pendente' | 'pago' | 'parcialmente pago' - Derivado dos pagamentos
  payments: Payment[]; // Fetched separately
  photosBefore: Photo[];
  photosAfter: Photo[];
};

export type Visit = {
  id: string;
  created_at: string;
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
    isOverdue?: boolean;
};

// --- Master Data Types ---
export type MasterDataItem = {
    id: string;
    name: string;
    created_at: string;
}
