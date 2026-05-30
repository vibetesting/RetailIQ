"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  h3BoundaryToLatLngs,
  viewportToH3Cells,
  getH3Resolution,
  h3ColorForNorm,
  H3_RAMP,
} from "@/lib/h3-utils";
import { useFilterStore, type H3Metric } from "@/lib/filter-store";
import type { H3Insight, ViewportBounds } from "@/types";

// The pane name for hexagons — sits below markerPane (600) so store pins
// always render on top even when both layers are visible.
const H3_PANE = "h3Pane";
const H3_PANE_Z = 350;

interface H3HexLayerProps {
  companyId?: string;
  onLoadingChange?: (loading: boolean) => void;
}

// Normalise a metric value to [0, 1] for the diverging ramp.
function makeNormalizer(metric: H3Metric, insights: H3Insight[]) {
  if (metric === "store_count") {
    const max = Math.max(1, ...insights.map((i) => i.store_count));
    // Log-scale so a single very dense cell doesn't wash everything green.
    const denom = Math.log10(max + 1) || 1;
    return (i: H3Insight) => Math.log10((i.store_count ?? 0) + 1) / denom;
  }
  if (metric === "avg_rating") {
    // Ratings are 1–5; normalise to 0–1 then invert (low rating = bad = red).
    return (i: H3Insight) =>
      i.avg_rating != null ? ((i.avg_rating - 1) / 4) : 0;
  }
  // whitespace_score — already 0–1; high score = good = green so invert for ramp.
  return (i: H3Insight) => 1 - (i.whitespace_score ?? 0);
}

const METRIC_LABEL: Record<H3Metric, string> = {
  store_count: "Store density",
  avg_rating: "Avg rating",
  whitespace_score: "Whitespace",
};

export default function H3HexLayer({
  companyId,
  onLoadingChange,
}: H3HexLayerProps) {
  const map = useMap();

  // Read metric directly from Zustand — no prop needed.
  const h3Metric = useFilterStore((s) => s.h3Metric);

  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const legendRef = useRef<L.Control | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rendererRef = useRef<L.Canvas | null>(null);

  // Stable refs for closure-captured values
  const metricRef = useRef(h3Metric);
  useEffect(() => { metricRef.current = h3Metric; }, [h3Metric]);
  const companyIdRef = useRef(companyId);
  useEffect(() => { companyIdRef.current = companyId; }, [companyId]);
  const onLoadingRef = useRef(onLoadingChange);
  useEffect(() => { onLoadingRef.current = onLoadingChange; }, [onLoadingChange]);

  // ── One-time setup: create h3Pane + canvas renderer + legend ──────────────
  useEffect(() => {
    // Create dedicated pane below markerPane so hexes never cover pins.
    if (!map.getPane(H3_PANE)) {
      const pane = map.createPane(H3_PANE);
      pane.style.zIndex = String(H3_PANE_Z);
      pane.style.pointerEvents = "auto";
    }

    // Single canvas renderer bound to the h3Pane — renders all polys on one
    // <canvas> element instead of hundreds of SVG paths.
    rendererRef.current = L.canvas({ pane: H3_PANE });

    // Legend control
    const LegendControl = L.Control.extend({
      onAdd() {
        const el = L.DomUtil.create("div", "h3-legend");
        el.style.cssText =
          "background:rgba(255,255,255,0.94);padding:6px 10px;border-radius:6px;" +
          "font:11px/1.4 system-ui;box-shadow:0 1px 6px rgba(0,0,0,.15);min-width:140px;";
        return el;
      },
    });
    const ctrl = new LegendControl({ position: "bottomright" }) as L.Control & {
      getContainer: () => HTMLElement;
    };
    ctrl.addTo(map);
    legendRef.current = ctrl;

    return () => {
      layerGroupRef.current?.remove();
      layerGroupRef.current = null;
      if (legendRef.current) map.removeControl(legendRef.current);
      legendRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // ── Update legend text whenever metric changes ────────────────────────────
  useEffect(() => {
    const ctrl = legendRef.current as (L.Control & { getContainer?: () => HTMLElement }) | null;
    if (!ctrl) return;
    const el = ctrl.getContainer?.();
    if (!el) return;
    const gradient = `linear-gradient(to right,${H3_RAMP.join(",")})`;
    const [lo, hi] =
      h3Metric === "store_count"
        ? ["Low", "High"]
        : h3Metric === "avg_rating"
        ? ["1.0 ★", "5.0 ★"]
        : ["Saturated", "Opportunity"];
    el.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px">${METRIC_LABEL[h3Metric]}</div>
      <div style="width:130px;height:8px;border-radius:4px;background:${gradient}"></div>
      <div style="display:flex;justify-content:space-between;margin-top:2px;color:#555">
        <span>${lo}</span><span>${hi}</span>
      </div>`;
  }, [h3Metric]);

  // ── Core fetch + render ───────────────────────────────────────────────────
  const fetchAndRender = useCallback(async () => {
    fetchControllerRef.current?.abort();
    fetchControllerRef.current = new AbortController();

    const zoom = map.getZoom();
    const resolution = getH3Resolution(zoom);

    // Below minimum zoom — clear and bail.
    if (resolution === null) {
      layerGroupRef.current?.clearLayers();
      return;
    }

    const b = map.getBounds();
    const viewport: ViewportBounds = {
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    };

    // polygonToCells replaces the old O(n²) lat/lng grid-sampling loop.
    const cells = viewportToH3Cells(viewport, resolution);
    if (cells.length === 0) return;

    onLoadingRef.current?.(true);
    try {
      const params = new URLSearchParams({
        resolution: String(resolution),
        cells: cells.join(","),
        ...(companyIdRef.current ? { company_id: companyIdRef.current } : {}),
      });

      const res = await fetch(`/api/h3?${params}`, {
        signal: fetchControllerRef.current.signal,
      });
      if (!res.ok) return;

      const insights: H3Insight[] = await res.json();
      if (!insights.length) {
        layerGroupRef.current?.clearLayers();
        return;
      }

      const normalize = makeNormalizer(metricRef.current, insights);
      const insightMap = new Map(insights.map((i) => [i.h3_index, i]));

      // Reuse existing layer group; clear old polygons first.
      if (!layerGroupRef.current) {
        layerGroupRef.current = L.layerGroup().addTo(map);
      } else {
        layerGroupRef.current.clearLayers();
      }

      const renderer = rendererRef.current!;

      cells.forEach((cell) => {
        const insight = insightMap.get(cell);
        if (!insight || insight.store_count === 0) return;

        let boundary: [number, number][];
        try {
          boundary = h3BoundaryToLatLngs(cell);
        } catch {
          return; // skip invalid/edge cells
        }

        const fill = h3ColorForNorm(normalize(insight));

        const poly = L.polygon(boundary, {
          color: fill,
          weight: 1,
          opacity: 0.85,
          fillColor: fill,
          fillOpacity: 0.5,
          smoothFactor: 1,
          pane: H3_PANE,
          renderer,
        });

        poly.bindTooltip(
          `<div style="font-size:12px;line-height:1.5;min-width:160px">
            <div><strong>${(insight.dominant_category ?? "—").replace(/</g, "&lt;")}</strong></div>
            <div>Stores: <strong>${insight.store_count}</strong></div>
            ${insight.avg_rating != null ? `<div>★ ${Number(insight.avg_rating).toFixed(2)}</div>` : ""}
            ${insight.whitespace_score != null ? `<div>Whitespace: ${Number(insight.whitespace_score).toFixed(2)}</div>` : ""}
            <div style="margin-top:2px;color:#888;font-size:10px">res ${resolution} · ${cell}</div>
          </div>`,
          { direction: "top", sticky: true, opacity: 0.95 },
        );

        poly.on("mouseover", () => poly.setStyle({ fillOpacity: 0.75, weight: 2 }));
        poly.on("mouseout", () => poly.setStyle({ fillOpacity: 0.5, weight: 1 }));

        layerGroupRef.current!.addLayer(poly);
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("H3 fetch error:", err);
      }
    } finally {
      onLoadingRef.current?.(false);
    }
  }, [map]);

  const debouncedFetch = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchAndRender, 300);
  }, [fetchAndRender]);

  useMapEvents({
    moveend: debouncedFetch,
    zoomend: debouncedFetch,
  });

  // Re-render when metric or companyId changes.
  useEffect(() => {
    fetchAndRender();
    return () => {
      fetchControllerRef.current?.abort();
      clearTimeout(debounceRef.current);
    };
  }, [h3Metric, companyId, fetchAndRender]);

  return null;
}
