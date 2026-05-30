# Map Engine

## Core Stack
- Leaflet + react-leaflet
- H3 indexing — [uber/h3](https://github.com/uber/h3)

---

# H3 Architecture

Every store receives an `h3_index` at ingestion. Pre-aggregated insights are
stored in `h3_insights` keyed by `(h3_index, resolution, company_id)`.

## Resolution Table (from h3geo.org/docs/core-library/restable)

| Res | Avg Area (km²) | Avg Edge (km) | Use case |
|-----|---------------|---------------|----------|
| r4  | 1,770         | 26.1          | Country view |
| r5  | 252.9         | 9.85          | State / region |
| r6  | 36.1          | 3.72          | Metro area |
| r7  | 5.16          | 1.41          | City district |
| r8  | 0.74          | 0.53          | Neighbourhood |
| r9  | 0.11          | 0.20          | Street block |

## Zoom → Resolution Mapping

| Zoom     | Resolution | Rationale |
|----------|------------|-----------|
| < 6      | —          | Country/continent — too many cells to be useful |
| 6–7      | r5         | State / region overview |
| 8–9      | r6         | Metro area |
| 10–11    | r7         | City district |
| 12–13    | r8         | Neighbourhood |
| ≥ 14     | r9         | Street block |

---

# Viewport Coverage

Uses `polygonToCells(ring, resolution)` from h3-js — the canonical H3 API
for viewport-to-cells conversion. Replaced the old O(n²) lat/lng grid-sampling
loop which had coverage gaps and depended on hand-tuned step sizes.

- Bounding box is converted to a closed `[lat, lng][]` ring
- If the result exceeds 500 cells, automatically falls back one resolution coarser
- Hard cap: 500 cells max per request

---

# Dynamic Hexagon Coloring

All metrics use a single diverging RAG ramp (green → amber → red):

| Metric | Low (green) | High (red) |
|--------|-------------|------------|
| Store density | 1 store | max in viewport (log-scaled) |
| Avg rating | 1.0 ★ | 5.0 ★ |
| Whitespace score | 0 (saturated) | 1.0 (opportunity) |

---

# Rendering

- Hexagons are drawn on a **single canvas element** via `L.canvas({ pane: "h3Pane" })`
  instead of individual SVG paths — handles 400+ cells with no frame-rate penalty
- Dedicated `h3Pane` (z-index 350) sits **below** `markerPane` (600) so store pins
  always render on top of heatmap cells

---

# Important Rule

Frontend NEVER computes:
- H3 aggregations
- scoring
- analytics

Frontend ONLY:
- renders pre-computed `h3_insights` rows
- calls `polygonToCells` to determine which cells are in the viewport
- applies color normalization client-side for display

---

# Supported Layers

- roads
- railways
- waterways
- metro
- POIs
- H3 heatmaps (store density / avg rating / whitespace)
- store pins (colored by store type)

---

# Performance Rules

- viewport loading only — never fetch all cells globally
- zoom-aware resolution — coarser at low zoom, finer at high zoom
- render hidden below zoom 6 (too many r4/r5 cells at country scale)
- never render all resolutions simultaneously
- canvas renderer for hexagons (one `<canvas>` element regardless of cell count)
