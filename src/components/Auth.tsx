import { Auth as SupabaseAuth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../utils/supabase'

export function Auth() {
  return (
    <SupabaseAuth
      supabaseClient={supabase}
      appearance={{ theme: ThemeSupa }}
      providers={['google', 'github']}
      redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/` : undefined}
    />
  )
}
