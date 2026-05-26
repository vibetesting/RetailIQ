# Database Schema

## Multi-Tenant Architecture

The platform is tenant-aware.

All stores belong to:
- company_id

This ensures:
- tenant isolation
- RBAC
- quota tracking
- company-specific analytics

---

# companies

Stores tenant/company records.

## Important Fields

| Field | Purpose |
|---|---|
| name | company name |
| is_demo | demo company |
| processing_limit | quota |
| monthly_processing_count | usage tracking |

---

# company_members

RBAC membership table.

## Roles

- global_admin
- admin
- company_admin
- company_user
- public_user

---

# profiles

Supabase-auth-linked profiles.

---

# stores

Master outlet table.

## Important Fields

- store_name
- place_id
- latitude
- longitude
- city
- state
- reviews_count
- avg_rating
- phone
- website
- company_id

## Important Notes

- place_id UNIQUE
- all analytics anchor to stores table

---

# store_images

Stores downloaded image metadata.

## Qualification Fields

- has_products
- has_assets
- is_irrelevant
- is_storefront
- confidence

## Important Notes

Used to short-circuit downstream AI.

---

# image_analysis_products

Per-image product/category analysis.

## Structure

```json
{
  "categories": {
    "high_confidence": [],
    "medium_confidence": [],
    "low_confidence": []
  },
  "brands": {
    "high_confidence": [],
    "medium_confidence": [],
    "low_confidence": []
  }
}
```

## Constraints

- image_id UNIQUE

---

# image_analysis_assets

Per-image asset analysis.

## Constraints

- image_id UNIQUE

---

# store_insights

Final aggregated store intelligence.

## Fields

- categories
- brands
- dominant_category
- confidence
- image_count
- assets

## Constraints

- store_id UNIQUE

---

# store_type_analysis

Final weighted store type output.

## Fields

- store_type
- raw_store_type
- weighted_scores
- weights_used
- confidence

## Constraints

- store_id UNIQUE

---

# Future Tables

## h3_insights
Aggregated spatial intelligence.

## poi_layers
POI enrichment.

## demographic_layers
Population + affluency.