import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Message } from '../../core/models/Message';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';

export const useMessagesQuery = () => {
  return useQuery({
    queryKey: ['secure_messages'],
    queryFn: async (): Promise<Message[]> => {
      const q = query(collection(db, 'secure_messages'), orderBy('timestamp', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    }
  });
};

export const useCreateMessageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newMessage: Omit<Message, 'id'>) => {
      const docRef = await addDoc(collection(db, 'secure_messages'), newMessage);
      return { id: docRef.id, ...newMessage } as Message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['secure_messages'] });
    }
  });
};
