import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Claim } from '../../core/models/Claim';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';

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
      const cRef = doc(db, 'claims', claimId);
      await updateDoc(cRef, { status: "Approved" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    }
  });
};

export const useRejectClaimMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (claimId: string) => {
      const cRef = doc(db, 'claims', claimId);
      await updateDoc(cRef, { status: "Rejected" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    }
  });
};

export const useCreateClaimMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newClaim: Omit<ExtendedClaim, 'id'>) => {
      await addDoc(collection(db, 'claims'), newClaim);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    }
  });
};
