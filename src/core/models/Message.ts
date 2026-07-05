export interface Message {
  id: string;
  sender: string;
  senderId: string;
  role: "Practitioner" | "Family" | "Participant" | "System";
  content: string;
  timestamp: string; // ISO string
}
