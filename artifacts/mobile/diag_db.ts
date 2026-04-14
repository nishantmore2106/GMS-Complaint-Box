import { createClient } from "@supabase/supabase-js";

async function diag() {
  const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
  );

  console.log("--- Tables ---");
  const { data: tables, error: tError } = await supabase.rpc('get_tables'); // If RPC exists
  if (tError) {
    // Fallback: Try a direct query if allowed
    const { data: qTables, error: qError } = await supabase
      .from("sites")
      .select("*")
      .limit(1);
    console.log("Sites accessible:", !qError);
    if (qError) console.error("Sites error:", qError);
  } else {
    console.log(tables);
  }
}

diag();
