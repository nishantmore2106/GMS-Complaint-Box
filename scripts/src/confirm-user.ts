import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhrlkydgmmrnrjbnabng.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocmxreWRnbW1ybnJqYm5hYm5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA3NDExNywiZXhwIjoyMDg5NjUwMTE3fQ.PwpykTiLCaCI1RAKBhPOyUzO45fewtPivKVXQ38EKSs';

const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const email = 'nishantmore087@gmail.com';
  console.log(`Confirming user: ${email}`);

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) return console.error(listError);

  const user = users.find(u => u.email === email);
  if (!user) return console.error('User not found in Auth.');

  const { error } = await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
  if (error) {
      console.error('Confirm Error:', error.message);
  } else {
      console.log('SUCCESS: Email confirmed for', email);
  }
}

main();
