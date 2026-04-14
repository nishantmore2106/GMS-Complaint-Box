-- Client Access & Site Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Ensure we have a default company if none exists
INSERT INTO public.companies (name)
SELECT 'GMS Facility Management'
WHERE NOT EXISTS (SELECT 1 FROM public.companies);

-- 2. Create a test site linked to the company
DO $$
DECLARE
    comp_id uuid;
BEGIN
    SELECT id INTO comp_id FROM public.companies LIMIT 1;
    
    INSERT INTO public.sites (name, company_id, address, client_name, client_phone)
    VALUES ('Elite Residences', comp_id, '123 Business Parkway', 'Test Client', '+91 9876543210')
    ON CONFLICT DO NOTHING;
END $$;

-- 3. Setup Client User mapping
-- IMPORTANT: You must first sign up 'client01@gmail.com' in the app or Supabase Auth.
-- After signing up, find their UUID in 'auth.users' and run this:
/*
INSERT INTO public.users (supabase_id, name, phone, role, company_id, status, display_id)
VALUES (
    'REPLACE_WITH_SUPABASE_AUTH_ID', 
    'Elite Client', 
    '+91 9876543210', 
    'client', 
    (SELECT id FROM public.companies LIMIT 1), 
    'active', 
    'CLI-001'
);
*/
