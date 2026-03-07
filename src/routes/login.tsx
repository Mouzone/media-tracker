import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { Auth } from '../components/Auth'
import { supabase } from '../utils/supabase'
import { useEffect } from 'react'

export const Route = createFileRoute('/login')({
  component: Login,
  beforeLoad: async () => {
     const { data: { session } } = await supabase.auth.getSession()
     if (session) {
       throw redirect({ to: '/' })
     }
  }
})

function Login() {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.navigate({ to: '/' })
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-[340px] flex flex-col items-center">
        {/* Minimal Logo / Header */}
        <div className="mb-10 w-full text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-50 border border-gray-100 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m3 15 2 2 4-4"/></svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1">Welcome Back</h1>
          <p className="text-sm text-gray-400 font-medium">Please sign in to continue</p>
        </div>
        
        <Auth />
      </div>
    </div>
  )
}
