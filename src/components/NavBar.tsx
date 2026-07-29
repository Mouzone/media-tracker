import { Link } from '@tanstack/react-router'

export function NavBar() {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="text-xl font-bold">Media Tracker</Link>
      <div className="flex gap-4 items-center">
        <Link to="/" className="hover:text-blue-500 [&.active]:text-blue-500">Dashboard</Link>
        <Link to="/bulk-upload" className="hover:text-blue-500 [&.active]:text-blue-500">Bulk Upload</Link>
      </div>
    </nav>
  )
}
