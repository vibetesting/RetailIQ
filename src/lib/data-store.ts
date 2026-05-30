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
        console.warn("[data-store] localStorage quota exceeded");
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
        // 25-second timeout so the UI never spins forever
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 25_000);
        try {
          const params = companyId ? `?company_id=${encodeURIComponent(companyId)}` : "";
          const res = await fetch(`/api/stores/all${params}`, { signal: controller.signal });
          clearTimeout(timer);
          if (!res.ok) throw new Error(`Server error ${res.status}`);
          const stores: CachedStore[] = await res.json();
          set({ allStores: stores, lastSyncedAt: Date.now(), isSyncing: false });
        } catch (err) {
          clearTimeout(timer);
          const msg =
            err instanceof Error
              ? err.name === "AbortError" ? "Request timed out after 25s" : err.message
              : "Sync failed";
          set({ syncError: msg, isSyncing: false });
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
    },
  ),
);
