import { create } from 'zustand';

interface AppState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  
  isOffline: boolean;
  pendingSyncCount: number;
  setOfflineStatus: (isOffline: boolean) => void;
  incrementPendingSync: () => void;
  clearPendingSync: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  
  isOffline: !navigator.onLine,
  pendingSyncCount: 0,
  setOfflineStatus: (isOffline) => set({ isOffline }),
  incrementPendingSync: () => set((state) => ({ pendingSyncCount: state.pendingSyncCount + 1 })),
  clearPendingSync: () => set({ pendingSyncCount: 0 })
}));
