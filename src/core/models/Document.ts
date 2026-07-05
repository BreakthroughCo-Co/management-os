export type DocumentCategory = 'financial' | 'audit' | 'policy' | 'ndis_participant' | 'general';

export interface DocumentMetadata {
  id: string;
  name: string;
  category: DocumentCategory;
  allowedRoles: string[]; // e.g. ['admin', 'finance'], ['all'] for public
  tags: string[];
  uploadedBy: string; // user id or email
  createdAt: string; // ISO string
  sizeBytes: number;
  url?: string; // Firebase Storage download URL
  textContent?: string; // Extracted text for AI RAG searches
  embedding?: number[]; // Vector embedding for semantic search
}
