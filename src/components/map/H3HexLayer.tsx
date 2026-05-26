"use client";

import { useEffect, useRef, useCallback } from "react";
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
  onLoadingChange?: (loading: boolean) => void;
}

export default function H3HexLayer({ companyId, activeLayer, onLoadingChange }: H3HexLayerProps) {
  const map = useMap();
  const polygonsRef = useRef<L.Polygon[]>([]);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keep stable ref for callback so debounce closure doesn't go stale
  const activeLayerRef = useRef(activeLayer);
  useEffect(() => { activeLayerRef.current = activeLayer; }, [activeLayer]);
  const companyIdRef = useRef(companyId);
  useEffect(() => { companyIdRef.current = companyId; }, [companyId]);
  const onLoadingRef = useRef(onLoadingChange);
  useEffect(() => { onLoadingRef.current = onLoadingChange; }, [onLoadingChange]);

  const clearPolygons = useCallback(() => {
    polygonsRef.current.forEach((p) => p.remove());
    polygonsRef.current = [];
  }, []);

  const fetchAndRender = useCallback(async () => {
    if (activeLayerRef.current === "stores") return;

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

    onLoadingRef.current?.(true);
    try {
      const params = new URLSearchParams({
        resolution: String(resolution),
        cells: cells.slice(0, 400).join(","),
        ...(companyIdRef.current ? { company_id: companyIdRef.current } : {}),
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
        const layer = activeLayerRef.current;

        if (layer === "whitespace") {
          fillColor = whitespaceColor(insight.whitespace_score);
        } else if (layer === "density") {
          fillColor = densityColor(insight.store_count, maxCount);
        } else if (layer === "brands") {
          const topBrandCount = Object.keys(insight.brand_penetration ?? {}).length;
          const ratio = Math.min(topBrandCount / 10, 1);
          fillOpacity = 0.3 + ratio * 0.5;
          fillColor = `hsl(${260 - ratio * 40}, 70%, ${60 - ratio * 20}%)`;
        }

        const polygon = L.polygon(latlngs as [number, number][], {
          fillColor,
          fillOpacity,
          color: "rgba(255,255,255,0.12)",
          weight: 0.5,
        });

        polygon.bindPopup(`
          <div style="font-family:system-ui;min-width:168px;padding:12px 14px;">
            <div style="font-weight:700;font-size:13px;margin-bottom:2px;">H3 Cell · r${resolution}</div>
            <div style="font-size:11px;color:#94a3b8;font-family:monospace;margin-bottom:10px;word-break:break-all;">${cell}</div>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr><td style="color:#64748b;padding:2px 0">Stores</td><td style="text-align:right;font-weight:600">${insight.store_count}</td></tr>
              <tr><td style="color:#64748b;padding:2px 0">Avg Rating</td><td style="text-align:right;font-weight:600">${insight.avg_rating?.toFixed(1) ?? "—"}</td></tr>
              <tr><td style="color:#64748b;padding:2px 0">Category</td><td style="text-align:right;font-weight:600;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${insight.dominant_category ?? "—"}</td></tr>
              <tr><td style="color:#64748b;padding:2px 0">Whitespace</td><td style="text-align:right;font-weight:600">${insight.whitespace_score?.toFixed(0) ?? "—"}</td></tr>
            </table>
          </div>
        `);

        polygon.addTo(map);
        polygonsRef.current.push(polygon);
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("H3 fetch error:", err);
      }
    } finally {
      onLoadingRef.current?.(false);
    }
  }, [map, clearPolygons]);

  const debouncedFetch = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchAndRender, 300);
  }, [fetchAndRender]);

  useMapEvents({
    moveend: debouncedFetch,
    zoomend: debouncedFetch,
  });

  useEffect(() => {
    fetchAndRender();
    return () => {
      clearPolygons();
      fetchControllerRef.current?.abort();
      clearTimeout(debounceRef.current);
    };
  }, [activeLayer, companyId, fetchAndRender, clearPolygons]);

  return null;
}
