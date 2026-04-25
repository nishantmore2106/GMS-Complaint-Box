-- Create supervisor_requests table
CREATE TABLE IF NOT EXISTS supervisor_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  client_id UUID REFERENCES users(id) NOT NULL,
  site_id UUID REFERENCES sites(id) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE supervisor_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read same company supervisor requests" ON supervisor_requests FOR SELECT TO authenticated 
USING (company_id = (SELECT company_id FROM public.users WHERE users.supabase_id = auth.uid()));

CREATE POLICY "Allow insert supervisor requests for clients" ON supervisor_requests FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.supabase_id = auth.uid() AND users.role = 'client'
  )
);

CREATE POLICY "Allow update supervisor requests for founders" ON supervisor_requests FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.supabase_id = auth.uid() AND users.role = 'founder'
  )
);
