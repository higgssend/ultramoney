-- Add portal_alias and portal_active to clients table
ALTER TABLE public.clients
ADD COLUMN portal_alias TEXT UNIQUE,
ADD COLUMN portal_active BOOLEAN DEFAULT TRUE;

-- Create an index on portal_alias for faster lookups in the portal
CREATE INDEX IF NOT EXISTS idx_clients_portal_alias ON public.clients (portal_alias);
