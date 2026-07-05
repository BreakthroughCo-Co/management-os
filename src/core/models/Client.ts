export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  ndisNumber: string;
  status: 'Active' | 'Pending Intake' | 'On Hold' | 'Discharged';
  dateOfBirth: string;
  primaryDiagnosis?: string;
  risk: 'Low' | 'Medium' | 'High' | 'Critical';
  nextReview: string;
  flags: string[];
  practitioner: string;
  funding: {
    totalBudget: number;
    utilized: number;
    remaining: number;
    exhaustionDate?: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
}
