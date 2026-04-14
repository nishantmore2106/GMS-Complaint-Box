-- Function to allow founders to reset supervisor passwords directly
-- This uses SECURITY DEFINER to perform updates on the auth.users table which is normally restricted.
CREATE OR REPLACE FUNCTION public.admin_reset_supervisor_password(target_user_id UUID, new_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    caller_role TEXT;
    target_role TEXT;
    caller_company_id UUID;
    target_company_id UUID;
BEGIN
    -- 1. Get caller info
    SELECT role, company_id INTO caller_role, caller_company_id 
    FROM public.users WHERE supabase_id = auth.uid();

    -- 2. Get target info
    SELECT role, company_id INTO target_role, target_company_id 
    FROM public.users WHERE id = target_user_id;

    -- 3. Validation: Only founders can reset, and must be in same company (or founder is super admin)
    IF caller_role != 'founder' THEN
        RAISE EXCEPTION 'Unauthorized: Only founders can reset passwords.';
    END IF;

    IF caller_company_id != target_company_id THEN
         -- If we want to allow cross-company reset for global founders, we'd check that here.
         -- For now, restrict to same company for security.
         RAISE EXCEPTION 'Unauthorized: Cannot reset password for users in a different company.';
    END IF;

    -- 4. Perform the auth reset
    -- We update the auth.users table. This requires the function to be SECURITY DEFINER.
    -- We also need to set the encrypted_password. 
    -- NOTE: In a real Supabase environment, you'd typically use a management API or a more complex SQL depending on the extensions enabled.
    -- Here we use the direct update approach.
    UPDATE auth.users 
    SET encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = now(),
        last_sign_in_at = NULL -- Force re-login
    WHERE id = (SELECT supabase_id FROM public.users WHERE id = target_user_id);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
