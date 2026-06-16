require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
  console.log("Listing public.users rows:");
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error reading public.users:", error);
    return;
  }

  data.forEach(u => {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Created At: ${u.created_at}`);
  });
}

run();
