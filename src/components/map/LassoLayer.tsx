"use client";

import { useEffect, useRef, useState } from "react";
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
  const [points, setPoints] = useState<[number, number][]>([]);
  const polygonRef = useRef<L.Polygon | null>(null);
  const pointsRef = useRef<[number, number][]>([]);

  // Keep ref in sync for event handlers
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    if (!isActive) {
      // Clean up polygon and reset
      if (polygonRef.current) {
        polygonRef.current.remove();
        polygonRef.current = null;
      }
      setPoints([]);
      return;
    }

    // Enter drawing mode
    const container = map.getContainer();
    container.style.cursor = "crosshair";
    map.dragging.disable();
    map.doubleClickZoom.disable();

    const handleClick = (e: L.LeafletMouseEvent) => {
      // Prevent event from propagating to map zoom/pan
      L.DomEvent.stopPropagation(e);
      const { lat, lng } = e.latlng;
      const newPoints: [number, number][] = [...pointsRef.current, [lat, lng]];
      setPoints(newPoints);

      // Draw/update polygon preview
      if (polygonRef.current) {
        polygonRef.current.setLatLngs(newPoints);
      } else {
        polygonRef.current = L.polygon(newPoints, {
          color: "#3b82f6",
          weight: 2,
          dashArray: "6 4",
          fillOpacity: 0.1,
          fillColor: "#3b82f6",
        }).addTo(map);
      }
    };

    const handleDblClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      const ring = pointsRef.current;
      if (ring.length >= 3) {
        const selectedIds = stores
          .filter((s) => pointInPolygon(s.latitude, s.longitude, ring))
          .map((s) => s.id);
        onSelectionChange(selectedIds);
      }
      onDeactivate();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDeactivate();
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
    };
  }, [isActive, map, stores, onSelectionChange, onDeactivate]);

  return null;
}
