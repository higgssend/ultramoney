-- Create api_keys table for UltraMoney API Gateway
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  key text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_used timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Enable read access for all users" ON public.api_keys FOR SELECT USING (true);
-- Or if you want to restrict it to specific roles, adjust the USING clause.

-- Optional: Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS api_keys_key_idx ON public.api_keys (key);
