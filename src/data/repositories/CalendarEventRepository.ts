import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '../../core/models/CalendarEvent';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export type { CalendarEvent };

export const useCalendarEventsQuery = () => {
  return useQuery({
    queryKey: ['calendar_events'],
    queryFn: async (): Promise<CalendarEvent[]> => {
      const snapshot = await getDocs(collection(db, 'calendar_events'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
    }
  });
};

export const useCreateCalendarEventMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newEvent: Omit<CalendarEvent, 'id'>) => {
      const docRef = await addDoc(collection(db, 'calendar_events'), newEvent);
      return { id: docRef.id, ...newEvent } as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
    }
  });
};
