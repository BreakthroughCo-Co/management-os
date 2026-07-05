import { DocumentMetadata } from '../models/Document';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export class KnowledgeRetrievalService {
  async queryKnowledgeBase(query: string, userRole: string): Promise<string> {
    // 1. Fetch all documents from Firestore
    const snapshot = await getDocs(collection(db, 'documents'));
    const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentMetadata));
    
    // 2. RBAC Filter: Only retrieve documents the user is allowed to see
    const accessibleDocs = allDocs.filter(doc => 
      doc.allowedRoles.includes('all') || doc.allowedRoles.includes(userRole.toLowerCase())
    );

    if (accessibleDocs.length === 0) {
      return "I could not find any documents in the knowledge base that you have permission to access to answer this query.";
    }

    // 3. Mock Semantic Search (just keyword matching on textContent and metadata for demo)
    const matchedDocs = accessibleDocs.filter(doc => {
      const q = query.toLowerCase();
      return (
        doc.name.toLowerCase().includes(q) || 
        doc.tags.some(t => t.toLowerCase().includes(q)) ||
        doc.category.toLowerCase().includes(q) ||
        (doc.textContent && doc.textContent.toLowerCase().includes(q))
      );
    });

    if (matchedDocs.length === 0) {
      return `I searched your accessible documents but could not find any information relating to "${query}".`;
    }

    // 4. Mock AI Response Synthesis
    const docNames = matchedDocs.map(d => d.name).join(", ");
    return `Based on the documents you have access to (${docNames}), here is the information regarding "${query}": The policy states standard operational procedures must be followed. (Mock synthesized response from Gemini/Genkit using secure context).`;
  }
}

export const knowledgeRetrieval = new KnowledgeRetrievalService();
