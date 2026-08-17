import React, { useState } from 'react'
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { auth } from '../lib/firebase'

/** Firebase error codes mapped to something worth reading. */
function describeAuthError(code: unknown): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again in a few minutes.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.'
    default:
      return 'Invalid email or password.'
  }
}

const INPUT_CLASSES =
  'focus-ring w-full rounded-lg border-b-2 border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-primary-500 dark:border-gray-700 dark:text-gray-100'

export function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
      await signInWithEmailAndPassword(auth, email, password)
      navigate({ to: '/' })
    } catch (err) {
      console.error('Login failed:', err)
      setError(describeAuthError((err as { code?: string })?.code))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center">
      <div className="mb-6 flex flex-col items-center">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Media Tracker
        </h1>
        <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Sign in to your library
        </p>
      </div>

      <form onSubmit={handleLogin} className="w-full space-y-4">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={INPUT_CLASSES}
            placeholder="Email address"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={INPUT_CLASSES}
            placeholder="Password"
            required
          />
        </div>

        <div className="flex items-center pt-2">
          <label className="group flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="focus-ring h-4 w-4 rounded border-gray-300 text-primary-600 dark:border-gray-600 dark:bg-gray-800"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Remember me</span>
          </label>
        </div>

        {error && (
          <p role="alert" className="pt-2 text-center text-xs text-red-500 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="focus-ring mt-4 flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Signing in" /> : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
