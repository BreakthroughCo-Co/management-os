export interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  credentials: {
    ahpraNumber?: string;
    wwccExpiry: string;
    firstAidExpiry: string;
  };
  metrics: {
    utilizationRate: number; // percentage
    burnoutRisk: 'Low' | 'Medium' | 'High';
    clientLoad: number;
  };
}
