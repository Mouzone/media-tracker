import { createClient } from '@supabase/supabase-js'

try {
  const url = "https://example.com" // Syntactically valid URL
  const key = "placeholder"
  console.log("Initializing Supabase client with dummy URL...")
  const client = createClient(url, key)
  console.log("Client initialized successfully")
} catch (error) {
  console.error("Client initialization failed:", error)
}
