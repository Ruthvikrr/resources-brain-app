const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.from('resources').select('*').limit(1);
  if (error) {
    console.error("Error connecting to Supabase:", error);
  } else {
    console.log("Success! Data:", data);
  }
}

test();
