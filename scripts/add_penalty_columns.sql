-- Add penalty and grace days to loans table
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS latefeepercentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS gracedays INT DEFAULT 0;

-- Optional: For existing loans that don't have this, set them to some default like 5% and 3 days if you want, but for now 0 is safe.
UPDATE loans SET latefeepercentage = 0 WHERE latefeepercentage IS NULL;
UPDATE loans SET gracedays = 0 WHERE gracedays IS NULL;
