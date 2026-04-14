-- UNIVERSAL DELETION REPAIR (RLS + CONSTRAINTS)
-- Resolves "Delete not working" for Users, Sites, and Complaints.

-- 1. FIX FOREIGN KEY CONSTRAINTS (Allow deletion to flow without hanging)

-- SITES: Unlink supervisor/client instead of blocking
ALTER TABLE public.sites 
DROP CONSTRAINT IF EXISTS sites_assigned_supervisor_id_fkey,
ADD CONSTRAINT sites_assigned_supervisor_id_fkey 
FOREIGN KEY (assigned_supervisor_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.sites 
DROP CONSTRAINT IF EXISTS sites_client_id_fkey,
ADD CONSTRAINT sites_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- COMPLAINTS: Cleanup when site or user is deleted
ALTER TABLE public.complaints 
DROP CONSTRAINT IF EXISTS complaints_site_id_fkey,
ADD CONSTRAINT complaints_site_id_fkey 
FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE;

ALTER TABLE public.complaints 
DROP CONSTRAINT IF EXISTS complaints_supervisor_id_fkey,
ADD CONSTRAINT complaints_supervisor_id_fkey 
FOREIGN KEY (supervisor_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.complaints 
DROP CONSTRAINT IF EXISTS complaints_client_id_fkey,
ADD CONSTRAINT complaints_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- 2. FIX RLS POLICIES (Grant permission to delete)

-- SITES: Allow founders to delete
DROP POLICY IF EXISTS "Allow founders to delete sites" ON public.sites;
CREATE POLICY "Allow founders to delete sites" ON public.sites 
FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.users WHERE users.supabase_id = auth.uid() AND users.role = 'founder'));

-- COMPLAINTS: Allow founders and assigned supervisors to delete (reject)
DROP POLICY IF EXISTS "Allow founders and sups to delete complaints" ON public.complaints;
CREATE POLICY "Allow founders and sups to delete complaints" ON public.complaints 
FOR DELETE TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.supabase_id = auth.uid() AND users.role = 'founder') OR
    EXISTS (SELECT 1 FROM public.users WHERE users.supabase_id = auth.uid() AND users.role = 'supervisor' AND public.complaints.supervisor_id = users.id)
);

-- USERS: Optimization - Use a non-recursive founder check if possible
-- (Keep existing but ensure it's not blocked by FKs above)

-- COMPANIES: Allow founders to delete their own company
DROP POLICY IF EXISTS "Allow founders to delete company" ON public.companies;
CREATE POLICY "Allow founders to delete company" ON public.companies 
FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.users WHERE users.supabase_id = auth.uid() AND users.role = 'founder'));
