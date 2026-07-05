import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDG2cuze57-tiiKsUXPCjngoEDQCMQwXgg",
  authDomain: "breakthrough-administration.firebaseapp.com",
  projectId: "breakthrough-administration",
  storageBucket: "breakthrough-administration.firebasestorage.app",
  messagingSenderId: "645123955994",
  appId: "1:645123955994:web:852f4e7aac005db01720a3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seed = async () => {
  const pCol = collection(db, 'practitioners');
  
  const practitioners = [
    {
      firstName: "Anitha",
      lastName: "Stone",
      email: "anitha.stone@breakthroughconsult.com.au",
      role: "Behaviour Support Practitioner",
      tier: "Proficient",
      specialties: ["Autism Spectrum", "Complex Trauma"],
      location: "Melbourne",
      onboardingTasks: [
        { id: "1", text: "NDIS Worker Screening Check", done: true },
        { id: "2", text: "Mandatory Reporting Module", done: true },
        { id: "3", text: "Shadowing Sessions", done: false }
      ]
    },
    {
      firstName: "Zubaida",
      lastName: "Baher",
      email: "zubaida.baher@breakthroughconsult.com.au",
      role: "Behaviour Support Practitioner",
      tier: "Core",
      specialties: ["Early Intervention", "ADHD"],
      location: "Sydney",
      onboardingTasks: [
        { id: "1", text: "NDIS Worker Screening Check", done: true },
        { id: "2", text: "Mandatory Reporting Module", done: false },
        { id: "3", text: "Shadowing Sessions", done: false }
      ]
    }
  ];

  for (const p of practitioners) {
    const q = query(pCol, where("firstName", "==", p.firstName), where("lastName", "==", p.lastName));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      await addDoc(pCol, p);
      console.log(`Added ${p.firstName} ${p.lastName}`);
    } else {
      console.log(`${p.firstName} ${p.lastName} already exists`);
    }
  }
  
  process.exit(0);
};

seed().catch(console.error);
