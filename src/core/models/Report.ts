export interface Report {
  id: string;
  name: string;
  type: 'Clinical' | 'Compliance' | 'Internal Review';
  date: string; // ISO string
  recipient: string;
  status: 'Draft' | 'Approved' | 'Sent';
  createdBy?: string;
}
