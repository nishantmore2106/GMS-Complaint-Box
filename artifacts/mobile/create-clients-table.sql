-- Create Clients Table
-- This table represents the formal client entity (e.g. a residential society or office building owner)

CREATE TABLE IF NOT EXISTS public.clients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add relationship to sites
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS client_entity_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Enable RLS (though I'll disable it for development as per previous turns)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY; -- Maintain dev simplicity

-- Refresh PGRST
NOTIFY pgrst, 'reload schema';
