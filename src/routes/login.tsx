import { createFileRoute, redirect } from '@tanstack/react-router'
import { Auth } from '../components/Auth'
import { supabase } from '../utils/supabase'

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
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Media Tracker</h1>
        <Auth />
      </div>
    </div>
  )
}
