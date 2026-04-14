-- NUCLEAR REPAIR: Force Clear Locks, Performance Indexes, and Atomic Purge
-- Run this if deletion is ALWAYS hanging.

-- 1. TERMINATE HANGING QUERIES (Release any locks)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'active' 
  AND query LIKE '%users%' 
  AND query NOT LIKE '%pg_stat_activity%'
  AND pid <> pg_backend_pid();

-- 2. ADD PERFORMANCE INDEXES (Must-Have for Speed)
CREATE INDEX IF NOT EXISTS idx_sites_sup_fix ON public.sites(assigned_supervisor_id);
CREATE INDEX IF NOT EXISTS idx_complaints_sup_fix ON public.complaints(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_users_sup_id_fix ON public.users(supabase_id);

-- 3. FIX CONSTRAINTS (Automatic Cleanup)
ALTER TABLE public.sites 
DROP CONSTRAINT IF EXISTS sites_assigned_supervisor_id_fkey,
ADD CONSTRAINT sites_assigned_supervisor_id_fkey 
FOREIGN KEY (assigned_supervisor_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.complaints 
DROP CONSTRAINT IF EXISTS complaints_supervisor_id_fkey,
ADD CONSTRAINT complaints_supervisor_id_fkey 
FOREIGN KEY (supervisor_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 4. ATOMIC PURGE PROCEDURE (SECURITY DEFINER = FASTEST)
CREATE OR REPLACE FUNCTION public.purge_user_data_v2(target_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS for speed
AS $$
BEGIN
    -- Unlink sites
    UPDATE public.sites SET assigned_supervisor_id = NULL WHERE assigned_supervisor_id = target_id;
    -- Unlink complaints
    UPDATE public.complaints SET supervisor_id = NULL WHERE supervisor_id = target_id;
    -- Delete metrics
    DELETE FROM public.supervisor_metrics WHERE supervisor_id = (SELECT supabase_id FROM public.users WHERE id = target_id);
    -- Delete user
    DELETE FROM public.users WHERE id = target_id;
END;
$$;
