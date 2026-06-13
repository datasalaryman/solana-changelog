import { authClient } from './auth-client'

const AUTHENTICATED_MARKER = 'solana-changelog:authenticated'

let reauthPromise: Promise<never> | null = null

export function markAuthenticated() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTHENTICATED_MARKER, 'true')
}

export function clearAuthenticated() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTHENTICATED_MARKER)
}

export function wasAuthenticated() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(AUTHENTICATED_MARKER) === 'true'
}

export function startReauth(): Promise<never> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Reauthorization is only available in the browser'))
  }

  if (reauthPromise) return reauthPromise

  reauthPromise = (async () => {
    const callbackURL = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const result = await authClient.signIn.social({
      provider: 'github',
      callbackURL,
      errorCallbackURL: '/login?reauth=true',
    })

    if (result.error) {
      clearAuthenticated()
      throw new Error(result.error.message || 'Failed to reauthorize')
    }

    if (result.data?.url) {
      window.location.assign(result.data.url)
      return await new Promise<never>(() => {})
    }

    return await new Promise<never>(() => {})
  })()

  return reauthPromise
}
