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

      // Validate document content is not empty
      if (!textContent || !textContent.trim()) {
        throw new Error('Rejected: Document cannot be empty or only whitespace.');
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

      // Recursive document chunking
      const chunks: string[] = [];
      if (textContent) {
        let index = 0;
        const chunkSize = 800;
        const overlap = 100;
        while (index < textContent.length) {
          const chunk = textContent.slice(index, index + chunkSize);
          chunks.push(chunk);
          index += chunkSize - overlap;
          if (chunkSize <= overlap) {
            break;
          }
        }
      }

      try {
        const functions = getFunctions(app);
        const generateGeminiEmbedding = httpsCallable(functions, "generateGeminiEmbedding");

        for (let i = 0; i < chunks.length; i++) {
          const chunkText = chunks[i];
          let chunkEmbedding: number[] = [];
          try {
            const embedResponse = await generateGeminiEmbedding({ text: chunkText });
            chunkEmbedding = (embedResponse.data as any).embedding || [];
          } catch (err) {
            console.error(`Failed to generate embedding for chunk ${i}:`, err);
          }

          await addDoc(collection(db, 'documents', docRef.id, 'chunks'), {
            text: chunkText,
            embedding: chunkEmbedding,
            allowedRoles,
            documentName: file.name,
          });
        }
      } catch (chunkErr) {
        console.error("Error creating chunks:", chunkErr);
      }

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

    const allChunks: { text: string; embedding: number[]; allowedRoles: string[]; documentName: string; score?: number }[] = [];
    for (const docObj of documents) {
      try {
        const chunksSnapshot = await getDocs(collection(db, 'documents', docObj.id, 'chunks'));
        chunksSnapshot.forEach(chunkDoc => {
          const data = chunkDoc.data();
          allChunks.push({
            text: data.text || "",
            embedding: data.embedding || [],
            allowedRoles: data.allowedRoles || docObj.allowedRoles || [],
            documentName: data.documentName || docObj.name || "",
          });
        });
      } catch (err) {
        console.error(`Failed to fetch chunks for document ${docObj.id}:`, err);
      }
    }

    // In-memory simulation/fallback if no chunks exist in DB yet
    if (allChunks.length === 0) {
      for (const docObj of documents) {
        if (docObj.textContent) {
          const text = docObj.textContent;
          let start = 0;
          const size = 800;
          const overlap = 100;
          while (start < text.length) {
            const chunkTextContent = text.substring(start, start + size);
            allChunks.push({
              text: chunkTextContent,
              embedding: docObj.embedding || [],
              allowedRoles: docObj.allowedRoles || [],
              documentName: docObj.name,
            });
            start += (size - overlap);
            if (size <= overlap) break;
          }
        }
      }
    }

    const scoredChunks = allChunks
      .filter(chunk => chunk.embedding && chunk.embedding.length > 0)
      .map(chunk => ({
        chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding)
      }))
      .sort((a, b) => b.score - a.score);

    return scoredChunks.slice(0, topK).map(res => ({
      text: res.chunk.text,
      textContent: res.chunk.text,
      embedding: res.chunk.embedding,
      allowedRoles: res.chunk.allowedRoles,
      documentName: res.chunk.documentName,
      name: res.chunk.documentName,
      score: res.score,
    }));
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
