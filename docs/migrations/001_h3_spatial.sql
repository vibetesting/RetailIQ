-- ============================================================
-- RetailIQ Migration 001: H3 Spatial Hexagonal Mapping
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add H3 index columns to stores table
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS h3_r5 text,
  ADD COLUMN IF NOT EXISTS h3_r7 text,
  ADD COLUMN IF NOT EXISTS h3_r9 text;

CREATE INDEX IF NOT EXISTS idx_stores_h3_r7 ON stores(h3_r7);

-- 2. Create h3_insights aggregation table
CREATE TABLE IF NOT EXISTS h3_insights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  h3_index text NOT NULL,
  resolution int NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  store_count int DEFAULT 0,
  avg_rating numeric(3,2),
  dominant_category text,
  brand_penetration jsonb DEFAULT '{}',
  category_mix jsonb DEFAULT '{}',
  whitespace_score numeric(5,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(h3_index, resolution, company_id)
);

CREATE INDEX IF NOT EXISTS idx_h3_insights_index ON h3_insights(h3_index);
CREATE INDEX IF NOT EXISTS idx_h3_insights_company ON h3_insights(company_id);
CREATE INDEX IF NOT EXISTS idx_h3_insights_resolution ON h3_insights(resolution);

-- 3. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_h3_insights_updated_at ON h3_insights;
CREATE TRIGGER update_h3_insights_updated_at
  BEFORE UPDATE ON h3_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS policies for h3_insights
ALTER TABLE h3_insights ENABLE ROW LEVEL SECURITY;

-- Allow read for all authenticated users within their company
CREATE POLICY "h3_insights_read_own_company" ON h3_insights
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid()
    )
  );

-- Allow service role full access (used by n8n)
CREATE POLICY "h3_insights_service_role" ON h3_insights
  FOR ALL
  USING (auth.role() = 'service_role');

-- 5. Verification query — should return 0 errors
SELECT
  'h3_insights table' AS check_name,
  COUNT(*) AS row_count
FROM h3_insights
UNION ALL
SELECT
  'stores h3_r7 column' AS check_name,
  COUNT(*) AS has_column
FROM information_schema.columns
WHERE table_name = 'stores' AND column_name = 'h3_r7';
