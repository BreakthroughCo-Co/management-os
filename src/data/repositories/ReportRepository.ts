import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Report } from '../../core/models/Report';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, orderBy, query } from 'firebase/firestore';

export type { Report };

// Seed data shown only if the reports collection is genuinely empty (first
// run against a fresh Firestore project) — matches the seeding pattern used
// by usePractitionersQuery/AnalyticsRepository elsewhere in this codebase,
// so the UI has something to look at before any real reports are created.
const SEED_REPORTS: Omit<Report, 'id'>[] = [
  {
    name: "Therapy Progress Summary - Q3",
    type: "Clinical",
    date: "2026-07-04",
    recipient: "NDIS Commission (Portal Upload)",
    status: "Sent",
  },
  {
    name: "Restrictive Practices Audit - June",
    type: "Compliance",
    date: "2026-07-01",
    recipient: "NDS Auditing Board",
    status: "Approved",
  },
  {
    name: "Participant Rollover Review - Charlie Davis",
    type: "Internal Review",
    date: "2026-06-15",
    recipient: "Clinical Lead",
    status: "Draft",
  },
];

export const useReportsQuery = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async (): Promise<Report[]> => {
      const q = query(collection(db, 'reports'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return SEED_REPORTS.map((r, idx) => ({ id: `seed-${idx}`, ...r }));
      }
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
    },
  });
};

export const useCreateReportMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newReport: Omit<Report, 'id'>) => {
      const docRef = await addDoc(collection(db, 'reports'), newReport);
      return { id: docRef.id, ...newReport } as Report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useSendReportMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reportId: string) => {
      // Seed rows (before any report is ever created for real) aren't
      // backed by a Firestore doc yet — nothing to persist a status change
      // against, so this is a no-op for them rather than a write error.
      if (reportId.startsWith('seed-')) return;
      await updateDoc(doc(db, 'reports', reportId), { status: 'Sent' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};
