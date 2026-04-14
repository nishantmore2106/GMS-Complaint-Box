import { createClient } from "@supabase/supabase-js";

async function checkColumns() {
  const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.from("sites").select("*").limit(1);
  if (error) {
    console.error("Error fetching sites:", error);
  } else if (data && data.length > 0) {
    console.log("Columns in 'sites' table:", Object.keys(data[0]));
  } else {
    console.log("No sites found to check columns.");
  }
}

checkColumns();
