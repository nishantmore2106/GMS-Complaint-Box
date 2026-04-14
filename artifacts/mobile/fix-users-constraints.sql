-- Fix Users Table for Self-Signup & Missing Columns
-- Run this in your Supabase SQL Editor

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ALTER COLUMN company_id DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- Refresh PGRST cache
NOTIFY pgrst, 'reload schema';
