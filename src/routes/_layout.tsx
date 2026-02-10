import { Outlet, createFileRoute } from '@tanstack/react-router'
import { NavBar } from '../../components/NavBar'

export const Route = createFileRoute('/_layout')({
  component: Layout,
})

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <NavBar />
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
