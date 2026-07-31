CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    collector_id UUID REFERENCES public.employees(id),
    status TEXT DEFAULT 'Activa',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own routes" ON public.routes FOR ALL USING (auth.uid() = lender_id);

ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES public.routes(id),
ADD COLUMN IF NOT EXISTS route_sequence INTEGER DEFAULT 0;
