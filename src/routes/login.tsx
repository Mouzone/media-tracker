import { createFileRoute, redirect } from '@tanstack/react-router'
import { Auth } from '../components/Auth'

export const Route = createFileRoute('/login')({
  component: Login,
  beforeLoad: async () => {
     throw redirect({ to: '/' })
  }
})

function Login() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6">
        <Auth />
    </div>
  )
}
