import { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function OfflineSyncManager() {
  const isOffline = useAppStore((state) => state.isOffline);
  const pendingSyncCount = useAppStore((state) => state.pendingSyncCount);
  const setOfflineStatus = useAppStore((state) => state.setOfflineStatus);
  const incrementPendingSync = useAppStore((state) => state.incrementPendingSync);
  const clearPendingSync = useAppStore((state) => state.clearPendingSync);

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOfflineStatus(false);
      if (pendingSyncCount > 0) {
        setIsSyncing(true);
        setTimeout(() => {
          setIsSyncing(false);
          clearPendingSync();
        }, 2000);
      }
    };
    const handleOffline = () => setOfflineStatus(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Simulate some offline changes being queued
    const interval = setInterval(() => {
      if (!navigator.onLine) {
        incrementPendingSync();
      }
    }, 15000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [pendingSyncCount, setOfflineStatus, incrementPendingSync, clearPendingSync]);

  return (
    <div className="flex items-center gap-2 text-xs font-medium">
      {isOffline ? (
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-900/50">
          <CloudOff className="h-3.5 w-3.5" />
          <span>Offline ({pendingSyncCount} unsaved)</span>
        </div>
      ) : isSyncing ? (
        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-900/50">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>Syncing...</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-900/50 opacity-70 hover:opacity-100 transition-opacity">
          <Cloud className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Synced</span>
        </div>
      )}
    </div>
  );
}
