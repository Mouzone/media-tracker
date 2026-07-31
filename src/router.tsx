import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { AuthContextType } from './contexts/AuthContext'

export const router = createTanStackRouter({
  routeTree,
  context: {
    auth: undefined! as AuthContextType,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
