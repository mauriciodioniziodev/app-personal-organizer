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
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  value: number;
  paymentStatus: 'pago' | 'pendente';
};

export type Visit = {
  id: string;
  projectId: string;
  date: string;
  status: 'realizada' | 'pendente' | 'cancelada';
  summary: string;
};

export type Photo = {
  id: string;
  projectId: string;
  type: 'antes' | 'depois';
  url: string;
  description: string;
};
