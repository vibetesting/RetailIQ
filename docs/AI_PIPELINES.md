# AI Pipelines

## Image Qualification

Purpose:
- determine if image is useful
- reduce unnecessary AI cost

## Product Detection

Extract:
- product categories
- brands

Confidence buckets:
- high
- medium
- low

## Rules
- no hallucination
- no guessing
- preserve confidence buckets

---

# Asset Detection

Detect:
- coolers
- racks
- POSM
- impulse displays
- outside displays
- bulk storage

---

# Store Type Detection

Normalize into:
- grocery
- supermarket
- pharmacy
- cosmetics
- electronics
- hardware
- others
- unknown

## Examples

indian grocery store → grocery
chemist → pharmacy
hypermarket → supermarket

---

# AI Models

| Use Case | Model |
|---|---|
| Qualification | GPT-4o-mini |
| Brand Detection | GPT-4o |
| Assets | GPT-4o-mini |
| Store Type | GPT-4o-mini |