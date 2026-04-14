import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fhrlkydgmmrnrjbnabng.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocmxreWRnbW1ybnJqYm5hYm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzQxMTcsImV4cCI6MjA4OTY1MDExN30.7hveTRBv5_AgxsrSA7vSPtN7i-XT_4HABuntiLJL57g'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
