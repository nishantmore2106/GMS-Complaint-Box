-- CREATE NEW METRICS AND LOGS TABLES FOR FOUNDER DASHBOARD

-- 1. site_metrics: Track performance per site
CREATE TABLE IF NOT EXISTS public.site_metrics (
    site_id UUID PRIMARY KEY REFERENCES public.sites(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    active_issues INTEGER DEFAULT 0,
    avg_resolution_time_hrs INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('good', 'medium', 'critical')) DEFAULT 'good',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. system_logs: Live activity feed
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'issue_created', 'resolved', 'assigned', 'system'
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. supervisor_metrics: Performance per supervisor
CREATE TABLE IF NOT EXISTS public.supervisor_metrics (
    supervisor_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    tasks_completed INTEGER DEFAULT 0,
    avg_time_hrs INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 5.0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.site_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisor_metrics ENABLE ROW LEVEL SECURITY;

-- POLICIES (Simplified: Company members can read)
CREATE POLICY "Company members can view site metrics" ON public.site_metrics
    FOR SELECT USING (company_id = (SELECT company_id FROM public.users WHERE supabase_id = auth.uid()));

CREATE POLICY "Company members can view system logs" ON public.system_logs
    FOR SELECT USING (company_id = (SELECT company_id FROM public.users WHERE supabase_id = auth.uid()));

CREATE POLICY "Company members can view supervisor metrics" ON public.supervisor_metrics
    FOR SELECT USING (company_id = (SELECT company_id FROM public.users WHERE supabase_id = auth.uid()));

-- Enable Real-time
ALTER PUBLICATION supabase_realtime ADD TABLE site_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE system_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE supervisor_metrics;
