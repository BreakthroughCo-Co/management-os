import { create } from 'zustand';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Role } from '../shared/constants/roles';

interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null;
  role: Role | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  googleAccessToken: string | null;
  loginWithGoogle: (role: Role) => Promise<void>;
  logout: () => void;
  resetTimeout: () => void;
}

let timeoutId: NodeJS.Timeout | null = null;
const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  tenantId: "hq-melbourne", // Hardcoded tenant ID for now
  isAuthenticated: false,
  isLoading: true,
  googleAccessToken: null,
  
  loginWithGoogle: async (role) => {
    try {
      const provider = new GoogleAuthProvider();
      // Request necessary Google Workspace scopes
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get the OAuth access token to use for REST API calls
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;

      // Ensure user role exists in Firestore
      // Note: If Firestore API is disabled, this will fail. We use a try/catch to ensure login succeeds even if Firestore fails.
      try {
        await setDoc(doc(db, 'users', user.uid), { role }, { merge: true });
      } catch (firestoreError) {
        console.warn("Could not save role to Firestore (API might be disabled):", firestoreError);
      }
      
      set({ 
        user: { 
          id: user.uid, 
          name: user.displayName || "Google User", 
          email: user.email || "",
          avatar: user.photoURL || undefined
        },
        role, 
        isAuthenticated: true,
        googleAccessToken: token
      });
      get().resetTimeout();
    } catch (e) {
      console.error("Google Login failed:", e);
      throw e;
    }
  },
  
  logout: async () => {
    await signOut(auth);
    if (timeoutId) clearTimeout(timeoutId);
    set({ role: null, isAuthenticated: false, user: null, googleAccessToken: null });
  },

  resetTimeout: () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (get().isAuthenticated) {
      timeoutId = setTimeout(() => {
        get().logout();
        alert("Your session has expired due to inactivity.");
      }, IDLE_TIMEOUT);
    }
  }
}));

// Initialize Firebase Auth listener
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      let defaultRole: Role = 'Practitioner';
      if (user.email === 'admin@breakthrough.com') {
        defaultRole = 'Admin';
      } else if (user.email?.includes('coordinator')) {
        defaultRole = 'Coordinator';
      }
      
      // Set authenticated state immediately so UI transitions are not blocked
      useAuthStore.setState({
        user: { id: user.uid, name: "Demo User", email: user.email || "demo@example.com" },
        role: defaultRole,
        isAuthenticated: true,
        isLoading: false
      });
      useAuthStore.getState().resetTimeout();
      
      // Load user role asynchronously in the background
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role) {
          useAuthStore.setState({
            role: userDoc.data().role as Role
          });
        }
      } catch (firestoreError) {
        console.error("Firestore error loading user role:", firestoreError);
      }
    } else {
      useAuthStore.setState({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  });

  const reset = () => useAuthStore.getState().resetTimeout();
  window.addEventListener('mousemove', reset);
  window.addEventListener('keydown', reset);
  window.addEventListener('scroll', reset);
  window.addEventListener('click', reset);
}
