const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Extract URL and Key from .env
const envPath = path.join(__dirname, '.env');
const envStr = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envStr.match(/EXPO_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envStr.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('complaints').select('id, current_phase, phase_history, status, session_id, supervisor_id').order('created_at', { ascending: false }).limit(2);
  console.log(JSON.stringify(data, null, 2));
}

run();
