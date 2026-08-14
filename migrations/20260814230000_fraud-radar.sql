-- Migration: Fraud Radar & Client Relationships
-- File: migrations/20260814230000_fraud-radar.sql

CREATE TABLE IF NOT EXISTS client_relationships (
  id TEXT PRIMARY KEY,
  lender_id UUID NOT NULL,
  client_id_a TEXT NOT NULL,
  client_name_a TEXT NOT NULL,
  client_id_b TEXT NOT NULL,
  client_name_b TEXT NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'Garante',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_relationships_lender ON client_relationships(lender_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_clients ON client_relationships(client_id_a, client_id_b);

ALTER TABLE client_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_relationships_policy" ON client_relationships;
CREATE POLICY "client_relationships_policy" ON client_relationships
  FOR ALL USING (auth.uid() = lender_id) WITH CHECK (auth.uid() = lender_id);
