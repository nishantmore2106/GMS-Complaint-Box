-- ==========================================
-- FINAL SECURITY RESTORATION (NON-RECURSIVE)
-- ==========================================
-- This migration fixes the 'infinite recursion' error (42P17) while maintaining isolated security.

-- 1. CLEANUP: Remove all old, broken policies
-- DO NOT REMOVE the manual drop logic, it ensures a clean state in the SQL Editor.

-- 2. THE GUARD: A special function to look up roles safely.
-- This MUST be SECURITY DEFINER to bypass the recursive check.
CREATE OR REPLACE FUNCTION public.get_user_role_safe()
RETURNS text AS $$
  -- SECURITY DEFINER makes this bypass RLS loops
  SELECT role FROM public.users WHERE supabase_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Helper to safely get company_id without recursion
CREATE OR REPLACE FUNCTION public.get_user_company_safe()
RETURNS uuid AS $$
  SELECT company_id FROM public.users WHERE supabase_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 3. APPLY FRESH POLICIES TO USERS TABLE

-- Policy A: Individual access (Self-read/Self-update)
-- Direct ID comparison is NOT recursive and extremely fast.
CREATE POLICY "user_self_access" ON public.users 
  FOR SELECT USING (auth.uid() = supabase_id);

CREATE POLICY "user_self_update" ON public.users 
  FOR UPDATE USING (auth.uid() = supabase_id);

-- Policy B: Administrative Review (Founder access)
-- Allows Founders to manage all users.
CREATE POLICY "founder_full_access" ON public.users 
  FOR ALL USING (get_user_role_safe() = 'founder');

-- Policy C: Supervisor read company members
CREATE POLICY "supervisor_read_company" ON public.users 
  FOR SELECT USING (
    get_user_role_safe() = 'supervisor' AND 
    company_id = get_user_company_safe()
  );

-- 4. APPLY POLICIES TO OTHER TABLES (Standardize)

-- SITES
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sites_access" ON public.sites;
CREATE POLICY "sites_access" ON public.sites
  FOR SELECT USING (
    get_user_role_safe() = 'founder' OR
    company_id = get_user_company_safe()
  );

-- COMPLAINTS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "complaints_access" ON public.complaints;
CREATE POLICY "complaints_access" ON public.complaints
  FOR ALL USING (
    get_user_role_safe() = 'founder' OR
    company_id = get_user_company_safe()
  );

-- 5. VERIFICATION
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
