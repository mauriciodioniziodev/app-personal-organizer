

export type Client = {
  id: string;
  createdAt: string;
  companyId: string;
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
  createdAt?: string;
  projectId: string;
  amount: number;
  status: 'pendente' | 'pago';
  dueDate: string;
  description: string;
}

export type Project = {
  id: string;
  createdAt?: string;
  clientId: string;
  companyId: string;
  visitId: string | null;
  name: string;
  description: string | null;
  status: string;
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
  clientId: string; 
  companyId: string;
  projectId: string; 
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
    company_id?: string; // Optional because some master data is global
}

export type UserProfile = {
    id: string;
    companyId: string;
    companyName?: string;
    fullName: string | null;
    email: string;
    status: 'pending' | 'authorized' | 'revoked';
    role: 'administrador' | 'usuario';
}

export type Company = {
    id: string;
    tradeName: string;
    isActive: boolean;
    createdAt: string;
    legalName?: string;
    cnpj?: string;
    phone?: string;
    address?: string;
    contactPerson?: string;
    notes?: string;
}

export type CompanySettings = {
    companyId: string;
    companyName: string;
    logoUrl: string | null;
    createdAt?: string;
}

    
