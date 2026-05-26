"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer as LeafletMapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapLayer, Store } from "@/types";
import H3HexLayer from "./H3HexLayer";
import StoreMarkers from "./StoreMarkers";
import LayerControls from "./LayerControls";

interface MapContainerProps {
  companyId?: string;
}

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

// Child component — useMap() only works inside <MapContainer>
function StoreLoader({
  companyId,
  onStores,
}: {
  companyId?: string;
  onStores: (stores: Store[]) => void;
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
        east:  String(b.getEast()),
        west:  String(b.getWest()),
        ...(companyId ? { company_id: companyId } : {}),
      });
      const res = await fetch(`/api/stores?${params}`, {
        signal: controllerRef.current.signal,
      });
      if (!res.ok) return;
      onStores(await res.json());
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError")
        console.error("Store fetch error:", err);
    }
  }, [map, companyId, onStores]);

  // Initial load
  useEffect(() => {
    fetchStores();
    return () => { controllerRef.current?.abort(); };
  }, [fetchStores]);

  // Re-fetch on pan/zoom
  useMapEvents({ moveend: fetchStores });

  return null;
}

export default function MapContainer({ companyId }: MapContainerProps) {
  const [activeLayer, setActiveLayer] = useState<MapLayer>("whitespace");
  const [showStores, setShowStores] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);

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

        <StoreLoader companyId={companyId} onStores={setStores} />

        {activeLayer !== "stores" && (
          <H3HexLayer companyId={companyId} activeLayer={activeLayer} />
        )}

        {showStores && <StoreMarkers stores={stores} />}
      </LeafletMapContainer>

      <LayerControls
        activeLayer={activeLayer}
        showStores={showStores}
        onLayerChange={setActiveLayer}
        onToggleStores={() => setShowStores((v) => !v)}
      />
    </div>
  );
}
