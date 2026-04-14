-- 🛠️ Fix Missing Complaints Columns
-- Run this in your Supabase SQL Editor to resolve the 'PGRST204' error.

-- 1. Add current_phase tracking
ALTER TABLE IF EXISTS public.complaints 
ADD COLUMN IF NOT EXISTS current_phase TEXT DEFAULT 'reported' NOT NULL;

-- 2. Add phase_history tracking
ALTER TABLE IF EXISTS public.complaints 
ADD COLUMN IF NOT EXISTS phase_history JSONB DEFAULT '[]' NOT NULL;

-- 3. Add work_notes (Required for field reports)
ALTER TABLE IF EXISTS public.complaints 
ADD COLUMN IF NOT EXISTS work_notes TEXT;

-- 💨 Force Schema Cache Reload (Optional but recommended)
NOTIFY pgrst, 'reload schema';
