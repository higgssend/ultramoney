-- Migration to support client avatars and enhanced phone/device collaterals
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatarurl TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE loans ADD COLUMN IF NOT EXISTS collateral JSONB;
