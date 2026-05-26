# FMCG Geo Intelligence Platform — Project Overview

## Vision
AI-powered retail geo-intelligence platform for FMCG brands, distributors, and sales teams.

The platform combines:
- AI image analysis
- retail intelligence
- geo-spatial analytics
- H3 hexagonal aggregation
- opportunity scoring
- conversational business intelligence

## Core Capabilities

### Retail Intelligence
- brand detection
- product category detection
- asset detection
- store type classification

### Geo Intelligence
- H3 heatmaps
- density analysis
- whitespace analysis
- competitor opportunity mapping
- POI overlays
- road/rail/water layers

### AI Capabilities
- image qualification
- shelf analysis
- storefront analysis
- conversational geo reasoning

Example:
> “Where should I sell nachos?”

## Current Stack

| Layer | Technology |
|---|---|
| Frontend | Lovable + React |
| Maps | Leaflet |
| Backend | Supabase |
| Workflow Engine | n8n |
| AI | OpenAI GPT-4o |
| Spatial | H3 |

## High-Level Architecture

CSV Upload
→ n8n Webhook
→ Store Insert
→ Image Download
→ Image Qualification
→ Product / Asset / Store Type AI
→ Aggregation
→ H3 Spatial Intelligence
→ Frontend Rendering
→ AI Query Layer