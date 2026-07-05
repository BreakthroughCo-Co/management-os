import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export interface Incident {
  id: string;
  title: string;
  type: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Resolved";
  dateLogged: string;
  reportedBy: string;
}

export const useIncidentsQuery = () => {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: async (): Promise<Incident[]> => {
      const snapshot = await getDocs(collection(db, 'incidents'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident));
    }
  });
};

export const useResolveIncidentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (incidentId: string) => {
      const iRef = doc(db, 'incidents', incidentId);
      await updateDoc(iRef, { status: "Resolved" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    }
  });
};
