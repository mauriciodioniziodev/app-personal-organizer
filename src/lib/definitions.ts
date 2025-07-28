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
  paymentStatus: string;
};

export type Visit = {
  id: string;
  projectId: string;
  date: string;
  status: string;
  summary: string;
};

export type Photo = {
  id: string;
  projectId: string;
  type: string;
  url: string;
  description: string;
};

export type MasterData = {
  paymentStatus: string[];
  visitStatus: string[];
  photoTypes: string[];
};
