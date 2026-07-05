import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Client } from '../../core/models/Client';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, query, orderBy, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';

export const useClientsQuery = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      const snapshot = await getDocs(collection(db, 'clients'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
    }
  });
};

export const useClientsInfiniteQuery = (pageSize = 20) => {
  return useInfiniteQuery({
    queryKey: ['clients', 'infinite'],
    queryFn: async ({ pageParam }: { pageParam?: DocumentSnapshot }) => {
      let q = query(collection(db, 'clients'), orderBy('lastName'), limit(pageSize));
      if (pageParam) {
        q = query(collection(db, 'clients'), orderBy('lastName'), startAfter(pageParam), limit(pageSize));
      }
      const snapshot = await getDocs(q);
      const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
      return { clients, lastDoc };
    },
    getNextPageParam: (lastPage) => lastPage.lastDoc,
    initialPageParam: undefined as DocumentSnapshot | undefined,
  });
};

export const useClientQuery = (id: string) => {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async (): Promise<Client> => {
      const snapshot = await getDoc(doc(db, 'clients', id));
      if (!snapshot.exists()) throw new Error("Client not found");
      return { id: snapshot.id, ...snapshot.data() } as Client;
    },
    enabled: !!id
  });
};

export const useCreateClientMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newClient: Omit<Client, 'id'>) => {
      const docRef = await addDoc(collection(db, 'clients'), newClient);
      return { id: docRef.id, ...newClient } as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });
};
