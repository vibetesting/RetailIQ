"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer as LeafletMapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapLayer, Store, StoreFilters } from "@/types";
import H3HexLayer from "./H3HexLayer";
import StoreMarkers from "./StoreMarkers";
import TopMapControls from "./TopMapControls";
import LassoLayer from "./LassoLayer";

interface MapContainerProps {
  companyId?: string;
  filters: StoreFilters;
  onStoreCountChange: (filtered: number, total: number) => void;
  onLassoChange: (ids: string[] | null) => void;
  lassoedIds: string[] | null;
  storeCount: number;
  totalCount: number;
}

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

function StoreLoader({
  companyId,
  filters,
  onStores,
  onCountChange,
  onLoadingChange,
}: {
  companyId?: string;
  filters: StoreFilters;
  onStores: (stores: Store[]) => void;
  onCountChange: (filtered: number, total: number) => void;
  onLoadingChange: (loading: boolean) => void;
}) {
  const map = useMap();
  const controllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
      const stores: Store[] = await res.json();
      onStores(stores);
      onCountChange(stores.length, stores.length);
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

export default function MapContainer({
  companyId,
  filters,
  onStoreCountChange,
  onLassoChange,
  lassoedIds,
  storeCount,
  totalCount,
}: MapContainerProps) {
  const [activeLayer, setActiveLayer] = useState<MapLayer>("whitespace");
  const [showStores, setShowStores] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [lassoActive, setLassoActive] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [storesLoading, setStoresLoading] = useState(false);
  const [hexLoading, setHexLoading] = useState(false);

  const isLoading = storesLoading || hexLoading;
  const isHeatmap = activeLayer !== "stores";

  const handleLassoSelection = useCallback(
    (ids: string[]) => {
      onLassoChange(ids);
      setLassoActive(false);
    },
    [onLassoChange]
  );

  const handleToggleLasso = useCallback(() => {
    if (lassoActive) {
      setLassoActive(false);
    } else {
      onLassoChange(null);
      setLassoActive(true);
    }
  }, [lassoActive, onLassoChange]);

  const handleDeactivateLasso = useCallback(() => {
    setLassoActive(false);
  }, []);

  const handleExport = useCallback(async () => {
    const ids = lassoedIds !== null ? lassoedIds : stores.map((s) => s.id);
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
      a.download = "stores-export.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  }, [lassoedIds, stores]);

  const displayStores = lassoedIds !== null
    ? stores.filter((s) => lassoedIds.includes(s.id))
    : stores;

  return (
    <div className="relative w-full h-full">
      {/* Loading bar */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 z-[1001] h-0.5 overflow-hidden">
          <div className="h-full bg-blue-500 animate-[loadbar_1.2s_ease-in-out_infinite]" />
        </div>
      )}

      <LeafletMapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <StoreLoader
          companyId={companyId}
          filters={filters}
          onStores={setStores}
          onCountChange={onStoreCountChange}
          onLoadingChange={setStoresLoading}
        />

        {isHeatmap && (
          <H3HexLayer
            companyId={companyId}
            activeLayer={activeLayer}
            onLoadingChange={setHexLoading}
          />
        )}

        {showStores && <StoreMarkers stores={displayStores} />}

        <LassoLayer
          isActive={lassoActive}
          stores={stores}
          onSelectionChange={handleLassoSelection}
          onDeactivate={handleDeactivateLasso}
        />
      </LeafletMapContainer>

      <TopMapControls
        activeLayer={activeLayer}
        onLayerChange={setActiveLayer}
        showStores={showStores}
        onToggleStores={() => setShowStores((v) => !v)}
        storeCount={storeCount}
        totalCount={totalCount}
        lassoActive={lassoActive}
        onToggleLasso={handleToggleLasso}
        lassoedCount={lassoedIds !== null ? lassoedIds.length : null}
        onExport={handleExport}
        exporting={exporting}
        isLoading={isLoading}
      />
    </div>
  );
}
