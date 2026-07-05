export interface Client {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  ndisNumber: string;
  planStart?: string;
  planEnd?: string;
  managementType?: 'ndia' | 'plan' | 'self';
  primaryDiagnosis?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  status: 'Active' | 'Pending Intake' | 'Inactive';
}

export interface Practitioner {
  id?: string;
  name: string;
  role: string;
  specialties: string[];
  location: string;
  email: string;
  phone: string;
}

export interface NDISPlan {
  id?: string;
  clientId: string;
  totalValue: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Pending';
  averageUtilisation: number;
}

export interface ABCObservation {
  id?: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  antecedent: string;
  behavior: string;
  consequence: string;
  practitionerId: string;
  practitionerName: string;
}

export interface BSPPlan {
  id?: string;
  clientId: string;
  clientName: string;
  authorId: string;
  authorName: string;
  status: 'Draft' | 'Approved' | 'Review Required';
  targetBehaviors: string[];
  proactiveStrategies: string[];
  reactiveStrategies: string[];
  createdAt: string;
}
