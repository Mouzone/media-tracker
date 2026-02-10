import { createClient } from '@supabase/supabase-js'

try {
  const url = "YOUR_SUPABASE_URL"
  const key = "YOUR_SUPABASE_ANON_KEY"
  console.log("Initializing Supabase client...")
  const client = createClient(url, key)
  console.log("Client initialized successfully")
} catch (error) {
  console.error("Client initialization failed:", error)
}
