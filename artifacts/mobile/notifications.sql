-- Push Notification System SQL
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL, -- e.g., 'complaint_new', 'complaint_update', 'system'
    is_read boolean DEFAULT false,
    data jsonb DEFAULT '{}'::jsonb, -- Store related IDs (e.g., complaint_id)
    created_at timestamp with time zone DEFAULT now()
);

-- Index for fast user-specific lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
