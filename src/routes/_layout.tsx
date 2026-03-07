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
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  )
}
