import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhrlkydgmmrnrjbnabng.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocmxreWRnbW1ybnJqYm5hYm5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA3NDExNywiZXhwIjoyMDg5NjUwMTE3fQ.PwpykTiLCaCI1RAKBhPOyUzO45fewtPivKVXQ38EKSs';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const email = 'nishantmore087@gmail.com';
  const password = 'more123';
  const name = 'Nishant More';

  console.log('--- Reseting/Seeding Supabase ---');

  // 1. Create/Get Auth User
  console.log(`Checking for user: ${email}`);
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
      console.error('List Error:', listError);
      return;
  }

  let user = users.find(u => u.email === email);
  if (!user) {
      console.log('Creating new auth user...');
      const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true
      });
      if (error) {
          console.error('Create Error:', error);
          return;
      }
      user = data.user;
  } else {
      console.log('User exists in Auth.');
  }

  if (!user) return;

  // 2. Create Company
  console.log('Setting up GMS Industries company...');
  const { data: company, error: cErr } = await supabase
    .from('companies')
    .insert([{ name: 'GMS Industries' }])
    .select()
    .single();

  if (cErr) {
      console.error('Company creation failed (likely already exists):', cErr.message);
      // Try to get first company
      const { data: comps } = await supabase.from('companies').select('*').limit(1);
      if (comps && comps.length > 0) {
          console.log('Using existing company.');
          // @ts-ignore
          company = comps[0];
      }
  }

  if (!company) {
    console.error('No company available.');
    return;
  }

  // 3. Create User Profile
  console.log('Linking profile...');
  const { error: pErr } = await supabase
    .from('users')
    .insert([{
      supabase_id: user.id,
      name: name,
      phone: '9876543210',
      role: 'founder',
      company_id: (company as any).id
    }]);

  if (pErr) {
      console.error('Profile creation error:', pErr.message);
  } else {
      console.log('SUCCESS: Founder seeded and linked!');
  }
}

main();
