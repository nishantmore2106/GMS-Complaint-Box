const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhrlkydgmmrnrjbnabng.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZocmxreWRnbW1ybnJqYm5hYm5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA3NDExNywiZXhwIjoyMDg5NjUwMTE3fQ.PwpykTiLCaCI1RAKBhPOyUzO45fewtPivKVXQ38EKSs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const email = 'support@gms.com';
  const password = 'dmore2912';

  console.log('--- USER VERIFICATION ---');

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) return console.error(listError);

  let user = users.find(u => u.email === email);

  if (user) {
    console.log(`User ID: ${user.id}`);
    console.log(`Confirmed: ${!!user.email_confirmed_at}`);
    console.log(`Last Sign In: ${user.last_sign_in_at}`);
    
    // Explicitly reset password and confirm
    console.log('Resetting password and confirming email...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: password,
      email_confirm: true
    });
    
    if (updateError) {
      console.error('Update Error:', updateError.message);
    } else {
      console.log('UPDATE SUCCESSFUL!');
    }
  } else {
    console.log('USER NOT FOUND. Re-running creation logic...');
    const { data: newData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });
    if (createError) console.error(createError);
    else console.log('CREATED SUCCESSFULLY!');
  }

  // Double check sign-in capability (Admin can't sign in as user easily via client API, but we've done our best)
  console.log('--- DONE ---');
}

main();
