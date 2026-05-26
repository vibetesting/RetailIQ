"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Store } from "@/types";

interface LassoLayerProps {
  isActive: boolean;
  stores: Store[];
  onSelectionChange: (ids: string[]) => void;
  onDeactivate: () => void;
}

function pointInPolygon(lat: number, lng: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export default function LassoLayer({ isActive, stores, onSelectionChange, onDeactivate }: LassoLayerProps) {
  const map = useMap();

  // Keep latest stores in a ref so the drawing effect never needs stores as a dep
  const storesRef = useRef<Store[]>(stores);
  useEffect(() => { storesRef.current = stores; }, [stores]);

  // Stable refs for callbacks so the drawing effect is stable
  const onSelectionRef = useRef(onSelectionChange);
  useEffect(() => { onSelectionRef.current = onSelectionChange; }, [onSelectionChange]);
  const onDeactivateRef = useRef(onDeactivate);
  useEffect(() => { onDeactivateRef.current = onDeactivate; }, [onDeactivate]);

  // Drawing state — all refs, no React state so clicks never trigger re-renders
  const polygonRef = useRef<L.Polygon | null>(null);
  const pointsRef = useRef<[number, number][]>([]);

  useEffect(() => {
    if (!isActive) {
      if (polygonRef.current) {
        polygonRef.current.remove();
        polygonRef.current = null;
      }
      pointsRef.current = [];
      return;
    }

    const container = map.getContainer();
    container.style.cursor = "crosshair";
    map.dragging.disable();
    map.doubleClickZoom.disable();

    const handleClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      const { lat, lng } = e.latlng;
      pointsRef.current = [...pointsRef.current, [lat, lng]];

      if (polygonRef.current) {
        polygonRef.current.setLatLngs(pointsRef.current);
      } else {
        polygonRef.current = L.polygon(pointsRef.current as [number, number][], {
          color: "#3b82f6",
          weight: 2,
          dashArray: "6 4",
          fillOpacity: 0.08,
          fillColor: "#3b82f6",
        }).addTo(map);
      }
    };

    const handleDblClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      const ring = pointsRef.current;
      if (ring.length >= 3) {
        const selectedIds = storesRef.current
          .filter((s) => pointInPolygon(s.latitude, s.longitude, ring))
          .map((s) => s.id);
        onSelectionRef.current(selectedIds);
      }
      onDeactivateRef.current();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDeactivateRef.current();
    };

    map.on("click", handleClick);
    map.on("dblclick", handleDblClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      container.style.cursor = "";
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.off("click", handleClick);
      map.off("dblclick", handleDblClick);
      document.removeEventListener("keydown", handleKeyDown);
      if (polygonRef.current) {
        polygonRef.current.remove();
        polygonRef.current = null;
      }
      pointsRef.current = [];
    };
  }, [isActive, map]); // stores intentionally NOT here — use storesRef instead

  return null;
}
