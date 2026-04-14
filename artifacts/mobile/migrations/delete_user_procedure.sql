-- PROCEDURE: purge_user_data
-- Atomically unlinks and deletes a user profile to prevent FK constraint hangs or errors.

CREATE OR REPLACE FUNCTION public.purge_user_data(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions to bypass RLS during cleanup
AS $$
BEGIN
    -- 1. Security Check: Verify caller is a founder
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE supabase_id = auth.uid() AND role = 'founder'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only founders can purge user data.';
    END IF;

    -- 2. Unlink from sites
    UPDATE public.sites
    SET assigned_supervisor_id = NULL
    WHERE assigned_supervisor_id = target_user_id;

    -- 3. Unlink from complaints
    UPDATE public.complaints
    SET supervisor_id = NULL
    WHERE supervisor_id = target_user_id;

    -- 4. Cleanup metrics
    -- Note: supervisor_metrics references auth.users(id), which we map from users.supabase_id
    DELETE FROM public.supervisor_metrics
    WHERE supervisor_id = (SELECT supabase_id FROM public.users WHERE id = target_user_id);

    -- 5. Delete the profile record
    DELETE FROM public.users
    WHERE id = target_user_id;
END;
$$;
