import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentMetadata, DocumentCategory } from '../../core/models/Document';
import { db, storage } from '../../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const useDocumentsQuery = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: async (): Promise<DocumentMetadata[]> => {
      const snapshot = await getDocs(collection(db, 'documents'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentMetadata));
    },
  });
};

interface UploadParams {
  file: File;
  category: DocumentCategory;
  allowedRoles: string[];
  tags: string[];
  uploadedBy: string;
}

import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../../lib/firebase';

export const useUploadDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, category, allowedRoles, tags, uploadedBy }: UploadParams) => {
      // 1. Upload file to Firebase Storage
      const storageRef = ref(storage, `documents/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      // 2. Extract text for RAG (simulated for PDFs, real for TXT)
      let textContent = file.name; // Fallback
      if (file.type === "text/plain") {
        textContent = await file.text();
      }

      // 3. Generate Embedding using Gemini
      let embedding: number[] = [];
      try {
        const functions = getFunctions(app);
        const generateGeminiEmbedding = httpsCallable(functions, "generateGeminiEmbedding");
        const embedResponse = await generateGeminiEmbedding({ text: textContent });
        embedding = (embedResponse.data as any).embedding || [];
      } catch (err) {
        console.error("Failed to generate embedding for document", err);
      }

      // 4. Save metadata to Firestore
      const docData: Omit<DocumentMetadata, 'id'> = {
        name: file.name,
        category,
        allowedRoles,
        tags,
        uploadedBy,
        sizeBytes: file.size,
        createdAt: new Date().toISOString(),
        url: downloadUrl,
        textContent,
        embedding,
      };

      const docRef = await addDoc(collection(db, 'documents'), docData);
      return { id: docRef.id, ...docData } as DocumentMetadata;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

// Cosine Similarity utility
const cosineSimilarity = (a: number[], b: number[]) => {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const searchSimilarDocuments = async (queryText: string, documents: DocumentMetadata[], topK: number = 3) => {
  if (documents.length === 0) return [];
  try {
    const functions = getFunctions(app);
    const generateGeminiEmbedding = httpsCallable(functions, "generateGeminiEmbedding");
    const response = await generateGeminiEmbedding({ text: queryText });
    const queryEmbedding = (response.data as any).embedding || [];
    
    if (queryEmbedding.length === 0) return [];

    const scoredDocs = documents
      .filter(doc => doc.embedding && doc.embedding.length > 0)
      .map(doc => ({
        doc,
        score: cosineSimilarity(queryEmbedding, doc.embedding!)
      }))
      .sort((a, b) => b.score - a.score);

    return scoredDocs.slice(0, topK).map(res => res.doc);
  } catch (err) {
    console.error("Semantic search failed:", err);
    return [];
  }
};

export const useDeleteDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'documents', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};
