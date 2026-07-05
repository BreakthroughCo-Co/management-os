export interface Incident {
  id: string;
  clientId?: string;
  practitionerId?: string;
  date: string;
  type: 'Behavioral' | 'Medical' | 'Safeguarding' | 'Other';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  status: 'Open' | 'Under Investigation' | 'Resolved';
  complianceReportable: boolean;
}
