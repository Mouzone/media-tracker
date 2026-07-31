import { createFileRoute, redirect } from '@tanstack/react-router'
import { Auth } from '../components/Auth'

export const Route = createFileRoute('/login')({
  component: Login,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/' })
    }
  }
})

function Login() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 transition-colors duration-200">
        <Auth />
    </div>
  )
}
