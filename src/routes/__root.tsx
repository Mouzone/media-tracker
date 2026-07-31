import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { AuthContextType } from '../contexts/AuthContext'

interface MyRouterContext {
  auth: AuthContextType
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return <Outlet />
}
