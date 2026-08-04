ALTER TABLE transactions ALTER COLUMN referenceid DROP NOT NULL;

UPDATE auth.users 
SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"roleId": "Admin"}'::jsonb 
WHERE raw_user_meta_data->>'roleId' IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  NEW.raw_user_meta_data = coalesce(NEW.raw_user_meta_data, '{}'::jsonb) || '{"roleId": "Admin"}'::jsonb;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
