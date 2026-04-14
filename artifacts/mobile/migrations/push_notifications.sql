-- ADD PUSH TOKEN SUPPORT
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_users_expo_push_token ON public.users(expo_push_token);
