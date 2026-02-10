import { createClient } from '@supabase/supabase-js'


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Helper to check if a URL is valid
const isValidUrl = (urlString: string) => {
  try {
    return Boolean(new URL(urlString))
  } catch (e) {
    return false
  }
}

// Fallback to a dummy URL if the provided one is invalid or missing
// This prevents the app from crashing on startup due to "Invalid URL" error from supabase-js
const urlToUse = isValidUrl(supabaseUrl) && supabaseUrl !== 'YOUR_SUPABASE_URL' 
  ? supabaseUrl 
  : 'https://placeholder.supabase.co'

const keyToUse = supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
  ? supabaseAnonKey
  : 'placeholder-key'

if (urlToUse === 'https://placeholder.supabase.co') {
  console.warn('⚠️  Supabase URL is invalid or missing. Using placeholder to prevent crash. Authentication and DB calls will fail, but the UI should render with mock data.')
}

export const supabase = createClient(urlToUse, keyToUse)
