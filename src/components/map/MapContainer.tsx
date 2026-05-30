"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Store, StoreTypeAnalysis, StoreFilters } from "@/types";
import H3HexLayer from "./H3HexLayer";
import StoreMarkers from "./StoreMarkers";
import TopMapControls from "./TopMapControls";
import LassoLayer from "./LassoLayer";
import { useFilterStore } from "@/lib/filter-store";

interface EnrichedStore extends Store {
  storeType?: StoreTypeAnalysis;
}

interface MapContainerProps {
  companyId?: string;
}

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

// ── Overlay tile layers (roads / railways / waterways) ────────────────────────
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(tilesRef.current).forEach((tl) => tl?.remove());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// ── Store data loader ──────────────────────────────────────────────────────────
function StoreLoader({
  companyId,
  filters,
  onStores,
  onCountChange,
  onLoadingChange,
}: {
  companyId?: string;
  filters: StoreFilters;
  onStores: (stores: EnrichedStore[]) => void;
  onCountChange: (filtered: number, total: number) => void;
  onLoadingChange: (loading: boolean) => void;
}) {
  const map = useMap();
  const controllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Track previous location to detect when to auto-pan
  const prevLocationRef = useRef({ state: "", city: "" });

  const fetchStores = useCallback(async () => {
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    const b = map.getBounds();
    onLoadingChange(true);
    try {
      const params = new URLSearchParams({
        north: String(b.getNorth()),
        south: String(b.getSouth()),
        east: String(b.getEast()),
        west: String(b.getWest()),
        ...(companyId ? { company_id: companyId } : {}),
        ...(filters.state ? { state: filters.state } : {}),
        ...(filters.city ? { city: filters.city } : {}),
        ...(filters.minRating !== null ? { min_rating: String(filters.minRating) } : {}),
        ...(filters.maxRating !== null ? { max_rating: String(filters.maxRating) } : {}),
        ...(filters.minReviews !== null ? { min_reviews: String(filters.minReviews) } : {}),
        ...(filters.storeTypes.length ? { store_types: filters.storeTypes.join(",") } : {}),
        ...(filters.brandsIdentified !== "any" ? { brands_identified: filters.brandsIdentified } : {}),
        ...(filters.categoriesIdentified !== "any" ? { categories_identified: filters.categoriesIdentified } : {}),
        ...(filters.categories.length ? { categories: filters.categories.join(",") } : {}),
        ...(filters.brands.length ? { brands: filters.brands.join(",") } : {}),
        ...(filters.assets.length ? { assets: filters.assets.join(",") } : {}),
        ...(filters.confidence.length ? { confidence: filters.confidence.join(",") } : {}),
      });

      const res = await fetch(`/api/stores?${params}`, {
        signal: controllerRef.current.signal,
      });
      if (!res.ok) return;
      const stores: EnrichedStore[] = await res.json();
      onStores(stores);
      onCountChange(stores.length, stores.length);

      // Auto-pan when state/city filter changes
      const prev = prevLocationRef.current;
      const locationChanged =
        filters.state !== prev.state || filters.city !== prev.city;
      if (locationChanged && stores.length > 0) {
        const pts = stores
          .filter((s) => s.latitude != null && s.longitude != null)
          .map((s) => [s.latitude, s.longitude] as [number, number]);
        if (pts.length > 0) {
          map.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 13 });
        }
        prevLocationRef.current = { state: filters.state, city: filters.city };
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError")
        console.error("Store fetch error:", err);
    } finally {
      onLoadingChange(false);
    }
  }, [map, companyId, filters, onStores, onCountChange, onLoadingChange]);

  const debouncedFetch = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchStores, 300);
  }, [fetchStores]);

  useEffect(() => {
    fetchStores();
    return () => {
      controllerRef.current?.abort();
      clearTimeout(debounceRef.current);
    };
  }, [fetchStores]);

  useMapEvents({ moveend: debouncedFetch });

  return null;
}

// ── Main MapContainer ──────────────────────────────────────────────────────────
export default function MapContainer({ companyId }: MapContainerProps) {
  const [stores, setStores] = useState<EnrichedStore[]>([]);
  const [storeCount, setStoreCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [storesLoading, setStoresLoading] = useState(false);
  const [hexLoading, setHexLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filters = useFilterStore((s) => s.filters);
  const lassoActive = useFilterStore((s) => s.lassoActive);
  const setLassoActive = useFilterStore((s) => s.setLassoActive);
  const lassoIds = useFilterStore((s) => s.lassoIds);
  const setLassoIds = useFilterStore((s) => s.setLassoIds);
  const layers = useFilterStore((s) => s.layers);

  // 150ms debounce — fast enough to feel instant, slow enough to batch rapid
  // multi-checkbox changes without hammering the API on every keystroke.
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 150);
    return () => clearTimeout(t);
  }, [filters]);

  const isLoading = storesLoading || hexLoading;

  // Stable callback — must NOT be inline on the prop or fetchStores deps
  // invalidate every render, causing an infinite re-fetch loop.
  const handleCountChange = useCallback((f: number, t: number) => {
    setStoreCount(f);
    setTotalCount(t);
  }, []);

  const handleDeactivateLasso = useCallback(() => setLassoActive(false), [setLassoActive]);

  const handleLassoSelection = useCallback(
    (ids: string[]) => {
      setLassoIds(ids);
      setLassoActive(false);
    },
    [setLassoIds, setLassoActive],
  );

  const handleExport = useCallback(async () => {
    const ids = lassoIds !== null ? lassoIds : stores.map((s) => s.id);
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
  }, [lassoIds, stores]);

  const displayStores = lassoIds !== null
    ? stores.filter((s) => lassoIds.includes(s.id))
    : stores;

  return (

    <div className="relative h-full w-full">
      {isLoading && (
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

        {/* Overlay reference tile layers (roads / railways / waterways) */}
        <OverlayTileLayers />

        <StoreLoader
          companyId={companyId}
          filters={debouncedFilters}
          onStores={setStores}
          onCountChange={handleCountChange}
          onLoadingChange={setStoresLoading}
        />

        {/* H3 hexagons — independent of viewMode, controlled by layers.h3 toggle */}
        {layers.h3 && (
          <H3HexLayer companyId={companyId} onLoadingChange={setHexLoading} />
        )}

        {layers.stores && <StoreMarkers stores={displayStores} />}

        <LassoLayer
          isActive={lassoActive}
          stores={stores}
          onSelectionChange={handleLassoSelection}
          onDeactivate={handleDeactivateLasso}
        />
      </LeafletMapContainer>

      <TopMapControls
        storeCount={storeCount}
        totalCount={totalCount}
        onExport={handleExport}
        exporting={exporting}
        isLoading={isLoading}
      />
    </div>
  );
}
