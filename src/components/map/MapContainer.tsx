"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer as LeafletMapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapLayer, Store } from "@/types";
import H3HexLayer from "./H3HexLayer";
import StoreMarkers from "./StoreMarkers";
import LayerControls from "./LayerControls";

interface MapContainerProps {
  companyId?: string;
}

// Default center: India (primary market per FMCG context)
const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

export default function MapContainer({ companyId }: MapContainerProps) {
  const [activeLayer, setActiveLayer] = useState<MapLayer>("whitespace");
  const [showStores, setShowStores] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const mapRef = useRef<L.Map | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);

  const fetchStores = useCallback(
    async (bounds: { north: number; south: number; east: number; west: number }) => {
      fetchControllerRef.current?.abort();
      fetchControllerRef.current = new AbortController();

      try {
        const params = new URLSearchParams({
          north: String(bounds.north),
          south: String(bounds.south),
          east: String(bounds.east),
          west: String(bounds.west),
          ...(companyId ? { company_id: companyId } : {}),
        });

        const res = await fetch(`/api/stores?${params}`, {
          signal: fetchControllerRef.current.signal,
        });

        if (!res.ok) return;
        const data: Store[] = await res.json();
        setStores(data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Store fetch error:", err);
        }
      }
    },
    [companyId]
  );

  return (
    <div className="relative w-full h-full">
      <LeafletMapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        ref={mapRef}
        whenReady={() => {
          if (mapRef.current) {
            const b = mapRef.current.getBounds();
            fetchStores({
              north: b.getNorth(),
              south: b.getSouth(),
              east: b.getEast(),
              west: b.getWest(),
            });

            mapRef.current.on("moveend", () => {
              if (!mapRef.current) return;
              const bounds = mapRef.current.getBounds();
              fetchStores({
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
              });
            });
          }
        }}
      >
        {/* Dark map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

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
