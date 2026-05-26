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
}: {
  companyId?: string;
  filters: StoreFilters;
  onStores: (stores: Store[]) => void;
  onCountChange: (filtered: number, total: number) => void;
}) {
  const map = useMap();
  const controllerRef = useRef<AbortController | null>(null);

  const fetchStores = useCallback(async () => {
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    const b = map.getBounds();
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

      // Fetch filtered count
      const filteredRes = await fetch(`/api/stores?${params}`, {
        signal: controllerRef.current.signal,
      });
      if (!filteredRes.ok) return;
      const filteredStores: Store[] = await filteredRes.json();
      onStores(filteredStores);

      // Fetch total (no joined filters) for the "N of M" counter
      const totalParams = new URLSearchParams({
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
      });
      const totalRes = await fetch(`/api/stores?${totalParams}`, {
        signal: controllerRef.current.signal,
      });
      if (!totalRes.ok) return;
      const totalStores: Store[] = await totalRes.json();
      onCountChange(filteredStores.length, totalStores.length);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError")
        console.error("Store fetch error:", err);
    }
  }, [map, companyId, filters, onStores, onCountChange]);

  useEffect(() => {
    fetchStores();
    return () => { controllerRef.current?.abort(); };
  }, [fetchStores]);

  useMapEvents({ moveend: fetchStores });

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
      // cancel lasso
      setLassoActive(false);
    } else {
      // clear previous lasso selection and start new
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

  // Display stores: if lasso active, highlight lassoed; otherwise show all
  const displayStores =
    lassoedIds !== null
      ? stores.filter((s) => lassoedIds.includes(s.id))
      : stores;

  return (
    <div className="relative w-full h-full">
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
        />

        {isHeatmap && (
          <H3HexLayer companyId={companyId} activeLayer={activeLayer} />
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
      />
    </div>
  );
}
