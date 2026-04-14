-- Create Enums
CREATE TYPE user_role AS ENUM ('client', 'supervisor', 'founder');
CREATE TYPE complaint_status AS ENUM ('pending', 'in_progress', 'resolved');
CREATE TYPE complaint_priority AS ENUM ('low', 'medium', 'high');

-- Create Tables
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_id UUID UNIQUE, -- Link to auth.users.id
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role DEFAULT 'client' NOT NULL,
  company_id UUID REFERENCES companies(id) NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  has_onboarded BOOLEAN DEFAULT FALSE NOT NULL,
  expo_push_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT, -- Added for expansion
  client_name TEXT, -- Added for expansion
  client_phone TEXT, -- Added for expansion
  authority_name TEXT, -- Added for expansion
  company_id UUID REFERENCES companies(id) NOT NULL,
  client_id UUID REFERENCES users(id), -- Changed to optional if using metadata instead
  assigned_supervisor_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  site_id UUID REFERENCES sites(id) NOT NULL,
  client_id UUID REFERENCES users(id) NOT NULL,
  supervisor_id UUID REFERENCES users(id),
  status complaint_status DEFAULT 'pending' NOT NULL,
  priority complaint_priority DEFAULT 'medium' NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  before_media_url TEXT,
  after_media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  current_phase TEXT DEFAULT 'reported' NOT NULL,
  phase_history JSONB DEFAULT '[]' NOT NULL
);

CREATE TABLE system_settings (
  id TIMESTAMP WITH TIME ZONE PRIMARY KEY DEFAULT NOW(),
  is_maintenance_mode BOOLEAN DEFAULT FALSE NOT NULL,
  maintenance_message TEXT DEFAULT 'System is undergoing scheduled maintenance.',
  is_paused BOOLEAN DEFAULT FALSE NOT NULL,
  current_version TEXT DEFAULT '1.0.0' NOT NULL,
  min_supported_version TEXT DEFAULT '1.0.0' NOT NULL,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE app_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  device_info JSONB,
  app_version TEXT,
  status TEXT DEFAULT 'open' NOT NULL,
  priority TEXT DEFAULT 'medium' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- 🛡️ STRICT MULTI-TENANCY POLICIES 🛡️

-- COMPANIES: Anyone authenticated can read their own company
CREATE POLICY "Allow read own company" ON companies FOR SELECT TO authenticated 
USING (id = (SELECT company_id FROM public.users WHERE users.supabase_id = auth.uid()));

-- USERS: Users can read all users in same company, can update themselves
CREATE POLICY "Allow read same company" ON users FOR SELECT TO authenticated 
USING (company_id = (SELECT company_id FROM public.users WHERE users.supabase_id = auth.uid()));

CREATE POLICY "Allow update self" ON users FOR UPDATE TO authenticated 
USING (supabase_id = auth.uid());

CREATE POLICY "Allow insert for founders" ON users FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.supabase_id = auth.uid() AND users.role = 'founder'));

CREATE POLICY "Allow founders to delete users" ON users FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.users WHERE users.supabase_id = auth.uid() AND users.role = 'founder'));

-- SITES: Users can read sites in their same company
CREATE POLICY "Allow read same company sites" ON sites FOR SELECT TO authenticated 
USING (company_id = (SELECT company_id FROM public.users WHERE users.supabase_id = auth.uid()));

CREATE POLICY "Allow insert sites for founders" ON sites FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.supabase_id = auth.uid() AND users.role = 'founder'));

CREATE POLICY "Allow update sites for founders" ON sites FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.users WHERE users.supabase_id = auth.uid() AND users.role = 'founder'));

-- COMPLAINTS: Users can read/write complaints in their same company
CREATE POLICY "Allow read same company complaints" ON complaints FOR SELECT TO authenticated 
USING (company_id = (SELECT company_id FROM public.users WHERE users.supabase_id = auth.uid()));

CREATE POLICY "Allow insert same company complaints" ON complaints FOR INSERT TO authenticated 
WITH CHECK (company_id = (SELECT company_id FROM public.users WHERE users.supabase_id = auth.uid()));

CREATE POLICY "Allow update same company complaints" ON complaints FOR UPDATE TO authenticated 
USING (company_id = (SELECT company_id FROM public.users WHERE users.supabase_id = auth.uid()));

-- SYSTEM SETTINGS: Anyone can read
CREATE POLICY "Allow read settings" ON system_settings FOR SELECT TO authenticated USING (true);

-- APP ISSUES: Founders can read all, anyone can insert
CREATE POLICY "Allow insert issues" ON app_issues FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow read issues for founders" ON app_issues FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.users WHERE users.supabase_id = auth.uid() AND users.role = 'founder'));
