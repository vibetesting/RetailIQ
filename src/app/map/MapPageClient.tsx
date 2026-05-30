"use client";

import { useState, useEffect } from "react";
import { Activity, Map, AlertTriangle } from "lucide-react";
import MapLayout from "@/components/map/MapLayout";
import StoreDetailDrawer from "@/components/map/StoreDetailDrawer";
import { useFilterStore } from "@/lib/filter-store";
import { useDataStore } from "@/lib/data-store";
import type { Store, StoreInsight, StoreTypeAnalysis } from "@/types";

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

interface EnrichedStore extends Store {
  insight?: StoreInsight;
  storeType?: StoreTypeAnalysis;
}

export default function MapPageClient() {
  const allStores = useDataStore((s) => s.allStores);
  const lastSyncedAt = useDataStore((s) => s.lastSyncedAt);
  const syncStores = useDataStore((s) => s.syncStores);
  const syncError = useDataStore((s) => s.syncError);

  useEffect(() => {
    // Trigger localStorage rehydration (skipped during SSR via skipHydration: true)
    useDataStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    // Sync on mount if cache is empty or stale — runs after rehydration
    const isStale =
      lastSyncedAt !== null && Date.now() - lastSyncedAt > STALE_THRESHOLD_MS;
    if (allStores === null || isStale) {
      syncStores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* AppTopBar */}
      <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border bg-surface px-4 shadow-[var(--shadow-elev-1)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground shadow-[var(--shadow-elev-1)]">
              <Activity className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">RetailIQ</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Geo Intelligence
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1 rounded-lg bg-surface-2 p-0.5">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-[var(--shadow-elev-1)]">
              <Map className="h-3.5 w-3.5" />
              Retail Explorer
            </span>
          </nav>
        </div>

        <a
          href="/"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Dashboard
        </a>
      </header>

      {/* Sync error banner */}
      {syncError && (
        <div className="flex items-center gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Failed to load store data: {syncError}. Click <strong>Refresh</strong> on the map to retry.</span>
        </div>
      )}

      <div className="min-h-0 flex-1">
        <MapLayout />
      </div>

      <StoreDetailDrawerController />
    </div>
  );
}

function StoreDetailDrawerController() {
  const selectedStoreId = useFilterStore((s) => s.selectedStoreId);
  const [store, setStore] = useState<EnrichedStore | null>(null);

  useEffect(() => {
    if (!selectedStoreId) {
      setStore(null);
      return;
    }
    fetch(`/api/stores/${selectedStoreId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStore(data ?? null))
      .catch(() => setStore(null));
  }, [selectedStoreId]);

  return <StoreDetailDrawer store={store} />;
}
