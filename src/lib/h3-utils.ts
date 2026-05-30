import { cellToBoundary, latLngToCell, polygonToCells } from "h3-js";
import type { ViewportBounds } from "@/types";

export { cellToBoundary, latLngToCell };

// Resolution table (from h3geo.org/docs/core-library/restable):
// r4 = 1,770 km²  (country)
// r5 =   252 km²  (state/region)
// r6 =    36 km²  (metro area)
// r7 =   5.2 km²  (city district)
// r8 =  0.74 km²  (neighbourhood)
// r9 =  0.11 km²  (street block)
//
// Rule of thumb: show hexes only when zoom ≥ 6 (country view is too crowded at r4).
// Return null to signal "don't render at all".
export function getH3Resolution(zoom: number): number | null {
  if (zoom < 6)   return null; // continent/country — too many cells
  if (zoom <= 7)  return 5;    // region / state
  if (zoom <= 9)  return 6;    // metro area
  if (zoom <= 11) return 7;    // city district  ← was stuck at r5 up to zoom 10
  if (zoom <= 13) return 8;    // neighbourhood
  return 9;                    // street block
}

// Use h3-js polygonToCells (centroid-containment) instead of the old O(n²)
// grid-sampling loop. polygonToCells is the canonical H3 API for viewport
// coverage — it's faster, gap-free, and doesn't need hand-tuned step sizes.
//
// Safety cap: if the polygon covers too many cells at the requested resolution
// (e.g. user has zoomed out quickly), fall back one level coarser rather than
// silently returning nothing.
const MAX_CELLS = 500;

export function viewportToH3Cells(
  bounds: ViewportBounds,
  resolution: number,
): string[] {
  // polygonToCells expects a closed [lat, lng] ring
  const ring: [number, number][] = [
    [bounds.north, bounds.west],
    [bounds.north, bounds.east],
    [bounds.south, bounds.east],
    [bounds.south, bounds.west],
    [bounds.north, bounds.west],
  ];

  let cells = polygonToCells(ring, resolution);

  // If the viewport is still too large, step up one resolution level
  if (cells.length > MAX_CELLS && resolution > 4) {
    cells = polygonToCells(ring, resolution - 1);
  }

  return cells.slice(0, MAX_CELLS);
}

// cellToBoundary already returns [lat, lng][] — just cast, no allocation.
export function h3BoundaryToLatLngs(h3Index: string): [number, number][] {
  return cellToBoundary(h3Index) as [number, number][];
}

// Diverging RAG ramp (green → amber → red) used for all H3 metrics.
// Matches Lovable's H3HeatmapLayer for visual consistency.
export const H3_RAMP = [
  "#16a34a", // green-600  — low density / high whitespace
  "#65a30d", // lime-600
  "#ca8a04", // yellow-600
  "#ea580c", // orange-600
  "#dc2626", // red-600    — high density / low whitespace
  "#991b1b", // red-800
] as const;

export function h3ColorForNorm(norm: number): string {
  if (!isFinite(norm)) return H3_RAMP[0];
  const v = Math.max(0, Math.min(0.9999, norm));
  return H3_RAMP[Math.floor(v * H3_RAMP.length)];
}
