"use client";

import { useState, useEffect } from "react";
import { Activity, Map } from "lucide-react";
import MapLayout from "@/components/map/MapLayout";
import StoreDetailDrawer from "@/components/map/StoreDetailDrawer";
import { useFilterStore } from "@/lib/filter-store";
import type { Store, StoreInsight, StoreTypeAnalysis } from "@/types";

interface EnrichedStore extends Store {
  insight?: StoreInsight;
  storeType?: StoreTypeAnalysis;
}

export default function MapPageClient() {
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
