

export type Client = {
  id: string;
  createdAt: string;
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
  createdAt?: string; // made optional
  projectId: string;
  amount: number;
  status: 'pendente' | 'pago';
  dueDate: string;
  description: string;
}

export type Project = {
  id: string;
  createdAt: string;
  clientId: string;
  visitId: string | null;
  name: string;
  description: string | null;
  status: string; // 'A iniciar', 'Em andamento', 'Pausado', 'Atrasado', 'Concluído', 'Cancelado'
  startDate: string;
  endDate: string;
  value: number; // Valor original
  discountPercentage: number | null;
  discountAmount: number | null;
  finalValue: number; // Valor com desconto
  paymentMethod: 'vista' | 'parcelado';
  paymentInstrument: string;
  paymentStatus: string; // Derivado dos pagamentos: 'pendente' | 'pago' | 'parcialmente pago'
  payments: Payment[];
  photosBefore: Photo[];
  photosAfter: Photo[];
};

export type Visit = {
  id: string;
  createdAt: string;
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
