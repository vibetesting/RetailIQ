# Map Engine

## Core Stack
- Leaflet
- H3 indexing

---

# H3 Architecture

Every store receives:
- h3_index

## Recommended Resolutions

| Zoom | Resolution |
|---|---|
| far | r5/r6 |
| mid | r7 |
| close | r8/r9 |

---

# Dynamic Hexagon Coloring

Hexagons can color by:
- store density
- whitespace opportunity
- demographics
- ratings
- category penetration
- cooler penetration

---

# Important Rule

Frontend NEVER computes:
- H3 aggregations
- scoring
- analytics

Frontend ONLY:
- renders
- filters
- visualizes

---

# Supported Layers

- roads
- railways
- waterways
- metro
- POIs
- H3 heatmaps
- store pins

---

# Performance Rules

- viewport loading only
- zoom-aware layers
- never render all resolutions simultaneously