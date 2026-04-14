const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhrlkydgmmrnrjbnabng.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocmxreWRnbW1ybnJqYm5hYm5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA3NDExNywiZXhwIjoyMDg5NjUwMTE3fQ.PwpykTiLCaCI1RAKBhPOyUzO45fewtPivKVXQ38EKSs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const email = 'support@gms.com';
  const password = 'dmore2912';
  const name = 'Dharmendra More';

  console.log('--- ADMIN SEED START ---');

  // 1. Create/Get Auth User
  const { data: { users } } = await supabase.auth.admin.listUsers();
  let user = users.find(u => u.email === email);

  if (!user) {
    console.log('Creating new auth user (confirmed)...');
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (error) return console.error('Auth Error:', error.message);
    user = data.user;
  } else {
    console.log('User exists, confirming email...');
    await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
  }

  // 2. Ensure Company
  let { data: company } = await supabase.from('companies').select('*').eq('name', 'GMS Industries').single();
  if (!company) {
    console.log('Creating company...');
    const { data, error } = await supabase.from('companies').insert([{ name: 'GMS Industries' }]).select().single();
    if (error) return console.error('Company Error:', error.message);
    company = data;
  }

  // 3. Ensure Profile
  console.log('Linking profile to users table...');
  const { error: pErr } = await supabase.from('users').upsert([
    {
      supabase_id: user.id,
      name: name,
      phone: '9876543210',
      role: 'founder',
      company_id: company.id
    }
  ], { onConflict: 'supabase_id' });

  if (pErr) {
    console.error('Profile Error:', pErr.message);
  } else {
    console.log('SUCCESS: Account is now LIVE and CONFIRMED!');
  }
}

main();
