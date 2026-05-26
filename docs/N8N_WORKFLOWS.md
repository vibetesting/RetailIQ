# n8n Workflows

## Current Workflow Structure

### Main Workflow
Handles:
- ingestion
- Google Maps enrichment
- image downloading
- image qualification
- orchestration
- aggregation
- persistence

### Subworkflow 1
Brand / Category / Assets workflow.

### Subworkflow 2
Store Type workflow.

---

# Image Qualification

Before expensive AI analysis:
- classify images
- filter irrelevant images
- detect storefronts
- detect shelves/assets

## Output

```json
{
  "has_products": true,
  "has_assets": false,
  "is_irrelevant": false,
  "is_storefront": true,
  "confidence": "high"
}
```

---

# Irrelevant Image Logic

Irrelevant images:
- skip downstream AI
- produce standardized empty outputs
- prevent merge deadlocks

---

# Product Pipeline

## Detect
- categories
- brands
- confidence buckets

## Aggregation
- merge unique detections
- preserve confidence
- compute dominant category
- compute top brands

---

# Store Type Pipeline

Priority:
1. storefront
2. assets fallback
3. unknown

## Source Weights

| Source | Weight |
|---|---|
| storefront | 0.50 |
| api | 0.35 |
| assets | 0.15 |

---

# Progressive Enrichment

Initial image limit:
- 5 images

If:
- low brand richness
- low category richness
- low confidence

Then:
- fetch additional images
- analyze only new images
- re-aggregate

---

# Important Design Principles

- avoid duplicate insertions
- use fallback outputs
- use upserts
- avoid merge deadlocks
- reduce token usage aggressively