import { StrictMode } from 'react'
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
