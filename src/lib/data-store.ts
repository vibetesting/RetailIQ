"use client";

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

function makeStorage() {
  const mem = new Map<string, string>();
  const memStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => { mem.set(k, v); },
    removeItem: (k: string) => { mem.delete(k); },
  };

  try {
    // Verify localStorage is accessible (throws in SSR or when blocked)
    localStorage.getItem("__test__");
    return {
      getItem: (k: string) => localStorage.getItem(k),
      setItem: (k: string, v: string) => {
        try {
          localStorage.setItem(k, v);
        } catch {
          // QuotaExceededError — in-memory state is still valid
          console.warn("[data-store] localStorage quota exceeded — cache not persisted");
        }
      },
      removeItem: (k: string) => localStorage.removeItem(k),
    };
  } catch {
    return memStorage;
  }
}

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
      storage: createJSONStorage(makeStorage),
      // Only persist data — isSyncing/syncError are transient UI state
      partialize: (state) => ({
        allStores: state.allStores,
        lastSyncedAt: state.lastSyncedAt,
      }),
      version: 1,
      // Version bump → wipe stale cache instead of crashing on schema mismatch
      migrate: () => ({ allStores: null, lastSyncedAt: null }),
    },
  ),
);
