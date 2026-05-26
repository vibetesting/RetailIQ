"use client";

import { useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  h3BoundaryToLatLngs,
  viewportToH3Cells,
  getH3Resolution,
  whitespaceColor,
  densityColor,
} from "@/lib/h3-utils";
import type { H3Insight, MapLayer, ViewportBounds } from "@/types";

interface H3HexLayerProps {
  companyId?: string;
  activeLayer: MapLayer;
}

export default function H3HexLayer({ companyId, activeLayer }: H3HexLayerProps) {
  const map = useMap();
  const polygonsRef = useRef<L.Polygon[]>([]);
  const fetchControllerRef = useRef<AbortController | null>(null);

  const clearPolygons = () => {
    polygonsRef.current.forEach((p) => p.remove());
    polygonsRef.current = [];
  };

  const fetchAndRender = async () => {
    if (activeLayer === "stores") return;

    fetchControllerRef.current?.abort();
    fetchControllerRef.current = new AbortController();

    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const resolution = getH3Resolution(zoom);

    const viewport: ViewportBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };

    const cells = viewportToH3Cells(viewport, resolution);
    if (cells.length === 0) return;

    try {
      const params = new URLSearchParams({
        resolution: String(resolution),
        cells: cells.slice(0, 400).join(","),
        ...(companyId ? { company_id: companyId } : {}),
      });

      const res = await fetch(`/api/h3?${params}`, {
        signal: fetchControllerRef.current.signal,
      });

      if (!res.ok) return;
      const insights: H3Insight[] = await res.json();

      clearPolygons();

      const insightMap = new Map(insights.map((i) => [i.h3_index, i]));
      const maxCount = Math.max(...insights.map((i) => i.store_count), 1);

      cells.forEach((cell) => {
        const insight = insightMap.get(cell);
        if (!insight || insight.store_count === 0) return;

        const latlngs = h3BoundaryToLatLngs(cell);
        let fillColor = "#374151";
        let fillOpacity = 0.55;

        if (activeLayer === "whitespace") {
          fillColor = whitespaceColor(insight.whitespace_score);
        } else if (activeLayer === "density") {
          fillColor = densityColor(insight.store_count, maxCount);
        } else if (activeLayer === "brands") {
          const topBrandCount = Object.keys(insight.brand_penetration ?? {}).length;
          const ratio = Math.min(topBrandCount / 10, 1);
          fillOpacity = 0.3 + ratio * 0.5;
          fillColor = `hsl(${260 - ratio * 40}, 70%, ${60 - ratio * 20}%)`;
        }

        const polygon = L.polygon(latlngs as [number, number][], {
          fillColor,
          fillOpacity,
          color: "rgba(255,255,255,0.1)",
          weight: 0.5,
        });

        polygon.bindPopup(`
          <div style="font-family: system-ui; min-width: 160px;">
            <div style="font-weight: 600; margin-bottom: 4px;">H3 Cell · r${resolution}</div>
            <div style="font-size: 12px; color: #6b7280; font-family: monospace;">${cell}</div>
            <div style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 13px;">
              <span>Stores</span><strong>${insight.store_count}</strong>
              <span>Rating</span><strong>${insight.avg_rating?.toFixed(1) ?? "—"}</strong>
              <span>Category</span><strong>${insight.dominant_category ?? "—"}</strong>
              <span>Whitespace</span><strong>${insight.whitespace_score?.toFixed(0) ?? "—"}</strong>
            </div>
          </div>
        `);

        polygon.addTo(map);
        polygonsRef.current.push(polygon);
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("H3 fetch error:", err);
      }
    }
  };

  useMapEvents({
    moveend: fetchAndRender,
    zoomend: fetchAndRender,
  });

  useEffect(() => {
    fetchAndRender();
    return () => {
      clearPolygons();
      fetchControllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayer, companyId]);

  return null;
}
