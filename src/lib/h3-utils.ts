import { cellToBoundary, latLngToCell } from "h3-js";
import type { ViewportBounds } from "@/types";

export { cellToBoundary, latLngToCell };

export function getH3Resolution(zoom: number): number {
  if (zoom <= 10) return 5;
  if (zoom <= 12) return 6;
  if (zoom <= 14) return 7;
  if (zoom <= 16) return 8;
  return 9;
}

export function h3BoundaryToLatLngs(
  h3Index: string
): [number, number][] {
  const boundary = cellToBoundary(h3Index);
  return boundary.map(([lat, lng]) => [lat, lng]);
}

// Step sized to ~half an H3 cell edge at each resolution so the grid never
// iterates more than ~10k points regardless of zoom.
const RESOLUTION_STEP: Record<number, number> = {
  5: 2.0,
  6: 0.8,
  7: 0.3,
  8: 0.1,
  9: 0.04,
};

export function viewportToH3Cells(
  bounds: ViewportBounds,
  resolution: number
): string[] {
  const step = RESOLUTION_STEP[resolution] ?? 0.3;
  const cells = new Set<string>();
  for (let lat = bounds.south; lat <= bounds.north; lat += step) {
    for (let lng = bounds.west; lng <= bounds.east; lng += step) {
      cells.add(latLngToCell(lat, lng, resolution));
    }
  }
  return Array.from(cells);
}

export function whitespaceColor(score: number | null): string {
  if (score === null) return "#374151";
  if (score >= 75) return "#10b981"; // green — high opportunity
  if (score >= 50) return "#f59e0b"; // amber — medium
  if (score >= 25) return "#ef4444"; // red — low
  return "#6b7280"; // gray — saturated
}

export function densityColor(count: number, max: number): string {
  const ratio = max > 0 ? count / max : 0;
  if (ratio >= 0.75) return "#312e81";
  if (ratio >= 0.5) return "#4338ca";
  if (ratio >= 0.25) return "#6366f1";
  return "#a5b4fc";
}
