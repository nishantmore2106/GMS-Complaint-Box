-- Scalability & Stability: Performance Indexes
-- Purpose: Optimize queries for high-traffic scenarios (200+ supervisors, 50+ sites)

-- 1. Complaints Table Indexes
-- Optimized for: Dashboard metrics, Analytics, and Site filtering
CREATE INDEX IF NOT EXISTS idx_complaints_company_created ON complaints(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_site_status ON complaints(site_id, status);
CREATE INDEX IF NOT EXISTS idx_complaints_supervisor ON complaints(supervisor_id) WHERE supervisor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_complaints_client ON complaints(client_id);

-- 2. Sites Table Indexes
-- Optimized for: Supervisor-specific site management and Site Registry
CREATE INDEX IF NOT EXISTS idx_sites_supervisor ON sites(assigned_supervisor_id) WHERE assigned_supervisor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sites_company ON sites(company_id);

-- 3. Users Table Indexes
-- Optimized for: Personnel Management and Auth resolution
CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role);
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_id);

-- 4. Audit & Activity Logs
-- Optimized for: Founder Activity Feed and System Monitoring
CREATE INDEX IF NOT EXISTS idx_system_logs_company_created ON system_logs(company_id, created_at DESC);

-- 5. Metrics Tables
-- Optimized for: Real-time Dashboard Updates
CREATE INDEX IF NOT EXISTS idx_site_metrics_updated ON site_metrics(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_supervisor_metrics_updated ON supervisor_metrics(last_updated DESC);
