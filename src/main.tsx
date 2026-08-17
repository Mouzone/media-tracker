import { StrictMode, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { MediaLibraryProvider } from './data/MediaLibraryProvider'
import { ToastProvider } from './components/Toast'
import './styles.css'

function App() {
  const auth = useAuth()

  // When the auth state changes (sign-in, sign-out, token refresh), re-evaluate
  // the route guards. TanStack Router doesn't do this automatically when the
  // context prop changes — it needs an explicit invalidate.
  //
  // This is what makes login work on the first click: onAuthStateChanged fires,
  // the context updates, this effect invalidates the router, and the login
  // route's beforeLoad guard sees isAuthenticated: true and redirects to "/".
  useEffect(() => {
    router.invalidate()
  }, [auth.isAuthenticated])

  if (auth.isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600" />
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  return <RouterProvider router={router} context={{ auth }} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          {/* Inside AuthProvider: the library subscription only opens once signed in. */}
          <MediaLibraryProvider>
            <App />
          </MediaLibraryProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
