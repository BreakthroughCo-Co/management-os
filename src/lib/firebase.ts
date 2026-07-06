import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDG2cuze57-tiiKsUXPCjngoEDQCMQwXgg",
  authDomain: "breakthrough-administration.firebaseapp.com",
  projectId: "breakthrough-administration",
  storageBucket: "breakthrough-administration.firebasestorage.app",
  messagingSenderId: "645123955994",
  appId: "1:645123955994:web:852f4e7aac005db01720a3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export commonly used services
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
export const storage = getStorage(app);

// Named export so alias modules can re-export by name
export { app };
export default app;
