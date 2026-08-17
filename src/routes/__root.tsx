import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { AuthContextType } from '../contexts/AuthContext'

interface RouterContext {
  auth: AuthContextType
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  errorComponent: ErrorScreen,
  notFoundComponent: NotFoundScreen,
})

const SHELL_CLASSES =
  'flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-white px-6 text-center dark:bg-gray-900'

/** Catches render errors anywhere in the tree instead of showing a blank page. */
function ErrorScreen({ error }: { error: Error }) {
  return (
    <div className={SHELL_CLASSES}>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Something went wrong</h1>
      <p className="max-w-lg rounded-lg bg-red-500/10 p-4 font-mono text-sm text-red-500">
        {error.message}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="focus-ring rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
      >
        Reload
      </button>
    </div>
  )
}

function NotFoundScreen() {
  return (
    <div className={SHELL_CLASSES}>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Page not found</h1>
      <Link
        to="/"
        className="focus-ring rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
      >
        Back to library
      </Link>
    </div>
  )
}
