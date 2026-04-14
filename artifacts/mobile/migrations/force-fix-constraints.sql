-- THE ULTIMATE FIX (REFINED): Automatic Unlinking via Database Constraints
-- This makes deletion instantaneous by moving the complexity to the database engine.

-- 1. Sites Table: Set supervisor to NULL if deleted
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sites') THEN
        ALTER TABLE public.sites 
        DROP CONSTRAINT IF EXISTS sites_assigned_supervisor_id_fkey,
        ADD CONSTRAINT sites_assigned_supervisor_id_fkey 
        FOREIGN KEY (assigned_supervisor_id) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Complaints Table: Set supervisor to NULL if deleted
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'complaints') THEN
        ALTER TABLE public.complaints 
        DROP CONSTRAINT IF EXISTS complaints_supervisor_id_fkey,
        ADD CONSTRAINT complaints_supervisor_id_fkey 
        FOREIGN KEY (supervisor_id) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. (Optional) Supervisor Metrics: Only attempt if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supervisor_metrics') THEN
        ALTER TABLE public.supervisor_metrics
        DROP CONSTRAINT IF EXISTS supervisor_metrics_supervisor_id_fkey,
        ADD CONSTRAINT supervisor_metrics_supervisor_id_fkey 
        FOREIGN KEY (supervisor_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;
