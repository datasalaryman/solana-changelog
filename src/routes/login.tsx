import { createFileRoute, Navigate, useSearch } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { authClient } from '../lib/auth-client'
import { useSession } from '../hooks/useSession'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): { reauth?: boolean } => ({
    reauth: search.reauth === true ? true : undefined,
  }),
})

function LoginPage() {
  const { data: session, isLoading } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const search = useSearch({ from: '/login' })
  const isReauth = search.reauth === true

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--lagoon-deep)]" />
      </div>
    )
  }

  if (session) {
    return <Navigate to="/" />
  }

  const handleSignIn = async () => {
    setError(null)
    setIsSigningIn(true)
    
    try {
      const result = await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/',
      })
      
      if (result.error) {
        setError(result.error.message || 'Failed to sign in')
        setIsSigningIn(false)
        return
      }
      
      if (result.data?.url) {
        window.location.href = result.data.url
      } else {
        setError('No redirect URL received from server')
        setIsSigningIn(false)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error occurred')
      setIsSigningIn(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--sea-ink)]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
            Sign in to access the Solana Technical Update Dashboard
          </p>
        </div>

        {isReauth && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700 border border-amber-200">
            Your session has expired. Please sign in again to continue.
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-[var(--fill)] px-4 py-3 text-sm font-medium text-[var(--sea-ink)] transition hover:bg-[var(--fill-hover)] border border-[var(--line)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true" width="20" height="20">
                <path
                  fill="currentColor"
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
                />
              </svg>
            )}
            {isSigningIn ? 'Redirecting...' : 'Continue with GitHub'}
          </button>
        </div>

        <p className="text-center text-xs text-[var(--sea-ink-soft)]">
          By signing in, you agree to authenticate via GitHub OAuth
        </p>
      </div>
    </div>
  )
}
