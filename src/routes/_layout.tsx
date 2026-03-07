import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { supabase } from '../utils/supabase'

export const Route = createFileRoute('/_layout')({
  component: Layout,
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
  }
})

function Layout() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  )
}
