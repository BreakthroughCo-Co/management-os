import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Practitioner } from '../../core/models/Practitioner';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, runTransaction } from 'firebase/firestore';

export interface ExtendedPractitioner extends Practitioner {
  specialties: string[];
  location: string;
  tier: "Core" | "Proficient" | "Advanced" | "Specialist";
  onboardingTasks: { id: string; text: string; done: boolean }[];
}

const MOCK_PRACTITIONERS: ExtendedPractitioner[] = [
  {
    id: "p1",
    firstName: "Sarah",
    lastName: "Jenkins",
    role: "Senior Clinical Psychologist",
    tier: "Advanced",
    specialties: ["Complex Trauma", "Autism Spectrum", "CBT"],
    location: "Melbourne Clinic",
    status: "Active",
    credentials: { wwccExpiry: "2027-12-31", firstAidExpiry: "2026-06-30" },
    metrics: { utilizationRate: 85, burnoutRisk: "Low", clientLoad: 25 },
    onboardingTasks: [
      { id: "t1", text: "NDIS Worker Screening Check", done: true },
      { id: "t2", text: "Mandatory Reporting Module", done: true },
      { id: "t3", text: "Shadowing Sessions", done: true }
    ]
  },
  {
    id: "p2",
    firstName: "David",
    lastName: "Chen",
    role: "Occupational Therapist",
    tier: "Proficient",
    specialties: ["Sensory Processing", "Assistive Tech"],
    location: "Sydney Hub",
    status: "Active",
    credentials: { wwccExpiry: "2027-12-31", firstAidExpiry: "2026-06-30" },
    metrics: { utilizationRate: 75, burnoutRisk: "Low", clientLoad: 20 },
    onboardingTasks: [
      { id: "t1", text: "NDIS Worker Screening Check", done: true },
      { id: "t2", text: "Mandatory Reporting Module", done: true },
      { id: "t3", text: "Shadowing Sessions", done: false }
    ]
  },
  {
    id: "p3",
    firstName: "Anitha",
    lastName: "Stone",
    role: "Behaviour Support Practitioner",
    tier: "Proficient",
    specialties: ["Autism Spectrum", "Complex Trauma"],
    location: "Melbourne Clinic",
    status: "Active",
    credentials: { wwccExpiry: "2027-12-31", firstAidExpiry: "2026-06-30" },
    metrics: { utilizationRate: 80, burnoutRisk: "Low", clientLoad: 22 },
    onboardingTasks: [
      { id: "t1", text: "NDIS Worker Screening Check", done: true },
      { id: "t2", text: "Mandatory Reporting Module", done: true },
      { id: "t3", text: "Shadowing Sessions", done: false }
    ]
  },
  {
    id: "p4",
    firstName: "Zubaida",
    lastName: "Baher",
    role: "Behaviour Support Practitioner",
    tier: "Core",
    specialties: ["Early Intervention", "ADHD"],
    location: "Sydney Hub",
    status: "Active",
    credentials: { wwccExpiry: "2027-12-31", firstAidExpiry: "2026-06-30" },
    metrics: { utilizationRate: 60, burnoutRisk: "Low", clientLoad: 15 },
    onboardingTasks: [
      { id: "t1", text: "NDIS Worker Screening Check", done: true },
      { id: "t2", text: "Mandatory Reporting Module", done: false },
      { id: "t3", text: "Shadowing Sessions", done: false }
    ]
  }
];

export const usePractitionersQuery = () => {
  return useQuery({
    queryKey: ['practitioners'],
    queryFn: async (): Promise<ExtendedPractitioner[]> => {
      try {
        const snapshot = await getDocs(collection(db, 'practitioners'));
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExtendedPractitioner));
        }
        return MOCK_PRACTITIONERS;
      } catch (error) {
        console.warn("Firestore access failed, returning mock practitioners:", error);
        return MOCK_PRACTITIONERS;
      }
    }
  });
};

export const useToggleTaskMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ practitionerId, taskId }: { practitionerId: string, taskId: string }) => {
      const pRef = doc(db, 'practitioners', practitionerId);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(pRef);
        if (!snapshot.exists()) {
          return;
        }
        const p = snapshot.data() as ExtendedPractitioner;
        const tasks = [...p.onboardingTasks];
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          task.done = !task.done;
          transaction.update(pRef, { onboardingTasks: tasks });
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practitioners'] });
    }
  });
};
