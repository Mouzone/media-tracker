import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'


export const Route = createFileRoute('/_layout')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: Layout,
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
