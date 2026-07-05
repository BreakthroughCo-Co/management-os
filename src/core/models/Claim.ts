export interface Claim {
  id: string;
  clientId: string;
  practitionerId: string;
  dateOfService: string;
  supportItemNumber: string;
  hours: number;
  rate: number;
  totalAmount: number;
  status: 'Draft' | 'Pending Validation' | 'Pending' | 'Approved' | 'Submitted' | 'Paid' | 'Rejected';
  validationErrors?: string[];
}
