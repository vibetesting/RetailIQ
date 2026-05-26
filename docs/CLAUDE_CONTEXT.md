# Claude Context

## Critical Architecture Rules

- Never compute H3 in frontend
- Always use upserts
- Preserve confidence buckets
- Storefront store_type has priority
- Irrelevant images skip downstream AI
- Avoid duplicate store insights
- Frontend only renders
- Backend computes analytics

---

# Stack

Frontend:
- Lovable
- React
- Tailwind
- Leaflet

Backend:
- Supabase
- n8n

AI:
- GPT-4o
- GPT-4o-mini

---

# Workflow

CSV Upload
→ n8n webhook
→ image qualification
→ AI analysis
→ aggregation
→ persistence
→ H3 aggregation
→ map rendering

---

# Important Tables

- stores
- store_images
- image_analysis_products
- image_analysis_assets
- store_insights
- store_type_analysis

---

# Important Constraints

- store_insights.store_id UNIQUE
- image_analysis_products.image_id UNIQUE
- image_analysis_assets.image_id UNIQUE

---

# Important Spatial Rules

- Use H3 indexing
- Use viewport querying
- Use zoom-aware resolutions