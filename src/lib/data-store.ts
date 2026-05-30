import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CachedStore } from "@/types";

interface DataState {
  allStores: CachedStore[] | null;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  syncError: string | null;
  syncStores: (companyId?: string) => Promise<void>;
  clearCache: () => void;
}

// Safe localStorage access — returns a no-op stub during SSR.
// createJSONStorage calls this factory lazily on each access, so the
// typeof window check fires at the right time (client vs server).
const storageFactory = () => {
  if (typeof window === "undefined") {
    return {
      getItem: (_k: string): string | null => null,
      setItem: (_k: string, _v: string): void => {},
      removeItem: (_k: string): void => {},
    };
  }
  return {
    getItem: (k: string) => localStorage.getItem(k),
    setItem: (k: string, v: string) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        console.warn("[data-store] localStorage quota exceeded — cache not persisted");
      }
    },
    removeItem: (k: string) => localStorage.removeItem(k),
  };
};

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      allStores: null,
      lastSyncedAt: null,
      isSyncing: false,
      syncError: null,

      syncStores: async (companyId?: string) => {
        set({ isSyncing: true, syncError: null });
        try {
          const params = companyId ? `?company_id=${encodeURIComponent(companyId)}` : "";
          const res = await fetch(`/api/stores/all${params}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const stores: CachedStore[] = await res.json();
          set({ allStores: stores, lastSyncedAt: Date.now(), isSyncing: false });
        } catch (err) {
          set({
            syncError: err instanceof Error ? err.message : "Sync failed",
            isSyncing: false,
          });
        }
      },

      clearCache: () => set({ allStores: null, lastSyncedAt: null, syncError: null }),
    }),
    {
      name: "retailiq-data-cache",
      storage: createJSONStorage(storageFactory),
      partialize: (state) => ({
        allStores: state.allStores,
        lastSyncedAt: state.lastSyncedAt,
      }),
      version: 1,
      migrate: () => ({ allStores: null, lastSyncedAt: null }),
      // Prevent SSR/client hydration mismatch — the server never has localStorage
      // data, so skip server-side rehydration entirely and let the client do it.
      skipHydration: true,
    },
  ),
);
