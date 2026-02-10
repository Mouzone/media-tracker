import { Link, useRouter } from '@tanstack/react-router'
import { supabase } from '../utils/supabase'

export function NavBar() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.invalidate()
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="text-xl font-bold">Media Tracker</Link>
      <div className="flex gap-4 items-center">
        <Link to="/" className="hover:text-blue-500 [&.active]:text-blue-500">Dashboard</Link>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">Sign Out</button>
      </div>
    </nav>
  )
}
