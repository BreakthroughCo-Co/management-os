export interface CalendarEvent {
  id: string;
  title: string;
  type: "telehealth" | "in-person" | "meeting";
  date: string; // ISO string for Firestore serialization
  time: string;
  practitioner: string;
  location: string;
}
