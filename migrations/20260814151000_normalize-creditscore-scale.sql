-- ============================================================================
-- Migration: Normalize Credit Score to Universal 300 - 850 (FICO / Datacrédito) Scale
-- ============================================================================

-- 1. Normalize existing clients from legacy 0-100 scale to 300-850 scale
UPDATE clients 
SET creditscore = ROUND(300 + (creditscore / 100.0) * 550) 
WHERE creditscore <= 100 AND creditscore > 0;

-- 2. Set default baseline for any zero, null, or out-of-range records
UPDATE clients 
SET creditscore = 650 
WHERE creditscore IS NULL OR creditscore < 300;

UPDATE clients
SET creditscore = 850
WHERE creditscore > 850;

-- 3. Set default column value to 650 (standard neutral starting score)
ALTER TABLE clients 
ALTER COLUMN creditscore SET DEFAULT 650;

-- 4. Add comment documenting the unified scale
COMMENT ON COLUMN clients.creditscore IS 'Credit Score on universal 300 to 850 FICO / Datacrédito scale';
