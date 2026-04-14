-- UNIVERSAL DELETION REPAIR V2: PERFORMANCE & RELIABILITY
-- Resolves "Everything Stuck" by adding missing indexes and robust policies.

-- 1. ADD PERFORMANCE INDEXES (Prevents full-table scans during deletion)
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON public.users(supabase_id);
CREATE INDEX IF NOT EXISTS idx_sites_company_id ON public.sites(company_id);
CREATE INDEX IF NOT EXISTS idx_sites_supervisor_id ON public.sites(assigned_supervisor_id);
CREATE INDEX IF NOT EXISTS idx_complaints_site_id ON public.complaints(site_id);
CREATE INDEX IF NOT EXISTS idx_complaints_supervisor_id ON public.complaints(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_complaints_client_id ON public.complaints(client_id);

-- 2. FIX FOREIGN KEY CONSTRAINTS (Instant Unlinking)
DO $$ 
BEGIN
    -- Sites
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sites') THEN
        ALTER TABLE public.sites DROP CONSTRAINT IF EXISTS sites_assigned_supervisor_id_fkey;
        ALTER TABLE public.sites ADD CONSTRAINT sites_assigned_supervisor_id_fkey FOREIGN KEY (assigned_supervisor_id) REFERENCES public.users(id) ON DELETE SET NULL;
        
        ALTER TABLE public.sites DROP CONSTRAINT IF EXISTS sites_client_id_fkey;
        ALTER TABLE public.sites ADD CONSTRAINT sites_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    -- Complaints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'complaints') THEN
        ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_site_id_fkey;
        ALTER TABLE public.complaints ADD CONSTRAINT complaints_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;

        ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_supervisor_id_fkey;
        ALTER TABLE public.complaints ADD CONSTRAINT complaints_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES public.users(id) ON DELETE SET NULL;

        ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_client_id_fkey;
        ALTER TABLE public.complaints ADD CONSTRAINT complaints_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. FIX RLS POLICIES (Universal Delete Permission)
-- Sites
DROP POLICY IF EXISTS "Allow founders to delete sites" ON public.sites;
CREATE POLICY "Allow founders to delete sites" ON public.sites FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.users WHERE users.supabase_id = auth.uid() AND users.role = 'founder'));

-- Complaints
DROP POLICY IF EXISTS "Allow founders and sups to delete complaints" ON public.complaints;
CREATE POLICY "Allow founders and sups to delete complaints" ON public.complaints FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.users WHERE users.supabase_id = auth.uid() AND users.role = 'founder'));

-- Users (Non-recursive check for speed)
DROP POLICY IF EXISTS "Allow founders to delete users" ON public.users;
CREATE POLICY "Allow founders to delete users" ON public.users FOR DELETE TO authenticated 
USING ((SELECT role FROM public.users WHERE supabase_id = auth.uid()) = 'founder');
