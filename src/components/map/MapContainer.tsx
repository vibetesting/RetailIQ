"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CachedStore, ViewportBounds } from "@/types";
import H3HexLayer from "./H3HexLayer";
import StoreMarkers from "./StoreMarkers";
import TopMapControls from "./TopMapControls";
import LassoLayer from "./LassoLayer";
import { useFilterStore } from "@/lib/filter-store";
import { useDataStore } from "@/lib/data-store";
import { applyClientFilters } from "@/lib/client-filter";

interface MapContainerProps {
  companyId?: string;
}

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

// ── Overlay tile layers ────────────────────────────────────────────────────────
const TILE_DEFS = {
  roads: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: "© OpenStreetMap",
  },
  railways: {
    url: "https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png",
    attr: "© OpenRailwayMap",
  },
  waterways: {
    url: "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",
    attr: "© OpenSeaMap",
  },
} as const;

function OverlayTileLayers() {
  const map = useMap();
  const layers = useFilterStore((s) => s.layers);
  const tilesRef = useRef<Partial<Record<keyof typeof TILE_DEFS, L.TileLayer>>>({});

  useEffect(() => {
    (Object.keys(TILE_DEFS) as (keyof typeof TILE_DEFS)[]).forEach((key) => {
      const on = layers[key];
      const existing = tilesRef.current[key];
      if (on && !existing) {
        const { url, attr } = TILE_DEFS[key];
        const tl = L.tileLayer(url, { attribution: attr, opacity: 0.7, maxZoom: 19 });
        tl.addTo(map);
        tilesRef.current[key] = tl;
      } else if (!on && existing) {
        map.removeLayer(existing);
        delete tilesRef.current[key];
      }
    });
  }, [layers, map]);

  useEffect(() => {
    return () => { Object.values(tilesRef.current).forEach((tl) => tl?.remove()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// ── ViewportTracker — syncs map bounds to outer component state ───────────────
function ViewportTracker({
  onViewportChange,
}: {
  onViewportChange: (b: ViewportBounds) => void;
}) {
  const map = useMap();

  const sync = useCallback(() => {
    const b = map.getBounds();
    onViewportChange({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    });
  }, [map, onViewportChange]);

  // Sync immediately on mount
  useEffect(() => { sync(); }, [sync]);

  useMapEvents({ moveend: sync });

  return null;
}

// ── AutoPanner — pans map when state/city filter changes ──────────────────────
function AutoPanner({
  stores,
  state,
  city,
}: {
  stores: CachedStore[];
  state: string;
  city: string;
}) {
  const map = useMap();
  const prevRef = useRef({ state: "", city: "" });

  useEffect(() => {
    const prev = prevRef.current;
    if (state === prev.state && city === prev.city) return;
    prevRef.current = { state, city };
    if (!state && !city) return;

    const pts = stores
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => [s.latitude, s.longitude] as [number, number]);

    if (pts.length > 0) {
      map.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 13 });
    }
  }, [stores, state, city, map]);

  return null;
}

// ── Main MapContainer ──────────────────────────────────────────────────────────
export default function MapContainer({ companyId }: MapContainerProps) {
  const [viewport, setViewport] = useState<ViewportBounds | null>(null);
  const [hexLoading, setHexLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Data cache
  const allStores = useDataStore((s) => s.allStores);
  const isSyncing = useDataStore((s) => s.isSyncing);
  const lastSyncedAt = useDataStore((s) => s.lastSyncedAt);
  const syncStores = useDataStore((s) => s.syncStores);

  // Filter + UI state
  const filters = useFilterStore((s) => s.filters);
  const lassoActive = useFilterStore((s) => s.lassoActive);
  const setLassoActive = useFilterStore((s) => s.setLassoActive);
  const lassoIds = useFilterStore((s) => s.lassoIds);
  const setLassoIds = useFilterStore((s) => s.setLassoIds);
  const layers = useFilterStore((s) => s.layers);

  // 150ms debounce so rapid checkbox changes batch into one filter pass
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 150);
    return () => clearTimeout(t);
  }, [filters]);

  // Client-side filter — replaces the API-based StoreLoader
  const filteredStores = useMemo(
    () => (allStores ? applyClientFilters(allStores, debouncedFilters, viewport) : []),
    [allStores, debouncedFilters, viewport],
  );

  const storeCount = filteredStores.length;
  const totalCount = allStores?.length ?? 0;

  const handleViewportChange = useCallback((b: ViewportBounds) => setViewport(b), []);

  const handleLassoSelection = useCallback(
    (ids: string[]) => { setLassoIds(ids); setLassoActive(false); },
    [setLassoIds, setLassoActive],
  );
  const handleDeactivateLasso = useCallback(() => setLassoActive(false), [setLassoActive]);

  const handleExport = useCallback(async () => {
    const ids = lassoIds !== null ? lassoIds : filteredStores.map((s) => s.id);
    if (ids.length === 0) return;
    setExporting(true);
    try {
      const res = await fetch("/api/stores/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeIds: ids }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stores-${lassoIds ? "lasso" : "filtered"}-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  }, [lassoIds, filteredStores]);

  const displayStores = lassoIds !== null
    ? filteredStores.filter((s) => lassoIds.includes(s.id))
    : filteredStores;

  return (
    <div className="relative h-full w-full">
      {(isSyncing || hexLoading) && (
        <div className="absolute inset-x-0 top-0 z-[1001] h-0.5 overflow-hidden">
          <div className="h-full bg-primary animate-[loadbar_1.2s_ease-in-out_infinite]" />
        </div>
      )}

      <LeafletMapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <OverlayTileLayers />

        {/* Tracks viewport bounds for client-side bbox filtering */}
        <ViewportTracker onViewportChange={handleViewportChange} />

        {/* Pans map when state/city filter changes */}
        <AutoPanner
          stores={filteredStores}
          state={debouncedFilters.state}
          city={debouncedFilters.city}
        />

        {layers.h3 && (
          <H3HexLayer companyId={companyId} onLoadingChange={setHexLoading} />
        )}

        {layers.stores && <StoreMarkers stores={displayStores} />}

        <LassoLayer
          isActive={lassoActive}
          stores={filteredStores}
          onSelectionChange={handleLassoSelection}
          onDeactivate={handleDeactivateLasso}
        />
      </LeafletMapContainer>

      <TopMapControls
        storeCount={storeCount}
        totalCount={totalCount}
        onExport={handleExport}
        exporting={exporting}
        isLoading={hexLoading}
        onRefresh={() => syncStores(companyId)}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
      />
    </div>
  );
}
