-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Policies for roles (Everyone can read, only admin can write, but for simplicity we allow read/write to authenticated users for now)
CREATE POLICY "Enable all for authenticated users on roles" ON public.roles
  FOR ALL USING (auth.role() = 'authenticated');

-- Create user_profiles to link auth.users to roles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL,
  name text,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users on user_profiles" ON public.user_profiles
  FOR ALL USING (auth.role() = 'authenticated');

-- Seed default roles
INSERT INTO public.roles (name, description, permissions)
VALUES 
  ('Administrador', 'Acceso total al sistema', '["manage_loans", "manage_clients", "manage_users", "view_reports", "manage_settings", "approve_loans", "manage_cash"]'::jsonb),
  ('Gerente', 'Gestión operativa completa sin configuración del sistema', '["manage_loans", "manage_clients", "view_reports", "approve_loans", "manage_cash"]'::jsonb),
  ('Cajero', 'Registro de pagos y manejo de caja', '["manage_cash", "manage_clients"]'::jsonb),
  ('Auditor', 'Lectura de reportes y auditoría', '["view_reports"]'::jsonb),
  ('Cobrador de App', 'Para uso desde el celular en rutas', '["manage_cash", "view_reports"]'::jsonb)
ON CONFLICT (name) DO UPDATE 
SET permissions = EXCLUDED.permissions, description = EXCLUDED.description;
