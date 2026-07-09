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
  loginWithGoogle: () => Promise<void>;
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
  
  loginWithGoogle: async () => {
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

      // SECURITY: role is never supplied by the client. New users are created
      // as 'Viewer' (the only role firestore.rules permits on doc creation);
      // an existing user's role is left untouched. Only an Admin can promote
      // someone to a higher role, via Settings > User Management.
      let resolvedRole: Role = 'Viewer';
      try {
        const userRef = doc(db, 'users', user.uid);
        const existing = await getDoc(userRef);
        if (existing.exists() && existing.data().role) {
          resolvedRole = existing.data().role as Role;
        } else {
          await setDoc(userRef, { role: 'Viewer' });
        }
      } catch (firestoreError) {
        console.warn("Could not read/create user role in Firestore (API might be disabled):", firestoreError);
      }
      
      set({ 
        user: { 
          id: user.uid, 
          name: user.displayName || "Google User", 
          email: user.email || "",
          avatar: user.photoURL || undefined
        },
        role: resolvedRole, 
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
      // SECURITY: never infer role from email address or hardcode an elevated
      // default — that was a client-side privilege-escalation vector. Default
      // to the lowest-privilege role until the real role loads from Firestore.
      useAuthStore.setState({
        user: { id: user.uid, name: user.displayName || "User", email: user.email || "" },
        role: 'Viewer',
        isAuthenticated: true,
        isLoading: false
      });
      useAuthStore.getState().resetTimeout();
      
      // Load user role asynchronously in the background
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && userDoc.data().role) {
          useAuthStore.setState({
            role: userDoc.data().role as Role
          });
        } else {
          // First sign-in for this user: create their profile as Viewer.
          // firestore.rules only permits role == 'Viewer' on create, so any
          // promotion must come from an Admin afterward.
          await setDoc(userRef, { role: 'Viewer' });
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
