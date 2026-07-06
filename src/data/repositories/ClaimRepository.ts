import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Claim } from '../../core/models/Claim';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { useAppStore } from '@/store/useAppStore';
import { workflowEngine } from '@/core/services/WorkflowEngine';

export interface ExtendedClaim extends Claim {
  patient: string;
  amount: number;
  date: string;
  type: string;
}

export const useClaimsQuery = () => {
  return useQuery({
    queryKey: ['claims'],
    queryFn: async (): Promise<ExtendedClaim[]> => {
      const snapshot = await getDocs(collection(db, 'claims'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExtendedClaim));
    }
  });
};

export const useApproveClaimMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (claimId: string) => {
      if (!navigator.onLine) {
        useAppStore.getState().incrementPendingSync();
      }
      const cRef = doc(db, 'claims', claimId);
      await updateDoc(cRef, { status: "Approved" });
    },
    onSuccess: (_data, claimId) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      workflowEngine.emit('claim:approved', { id: claimId });
    }
  });
};

export const useRejectClaimMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (claimId: string) => {
      if (!navigator.onLine) {
        useAppStore.getState().incrementPendingSync();
      }
      const cRef = doc(db, 'claims', claimId);
      await updateDoc(cRef, { status: "Rejected" });
    },
    onSuccess: (_data, claimId) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      workflowEngine.emit('claim:rejected', { id: claimId });
    }
  });
};

export const useCreateClaimMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newClaim: Omit<ExtendedClaim, 'id'>) => {
      if (!navigator.onLine) {
        useAppStore.getState().incrementPendingSync();
      }
      await addDoc(collection(db, 'claims'), newClaim);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    }
  });
};
