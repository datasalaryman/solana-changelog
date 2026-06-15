import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authClient } from '../lib/auth-client'
import { githubRequestQueue } from '../lib/requestQueue'
import { clearAuthenticated, markAuthenticated, startReauth, wasAuthenticated } from '../lib/reauth'

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const result = await authClient.getSession()

      if (result.data) {
        markAuthenticated()
        return result.data
      }

      if (wasAuthenticated() && typeof window !== 'undefined' && window.location.pathname !== '/login') {
        return startReauth()
      }

      return result.data
    },
    staleTime: 60 * 4 * 1000,
    refetchInterval: 60 * 4 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()

  return async () => {
    await authClient.signOut()
    clearAuthenticated()
    queryClient.removeQueries({ queryKey: ['session'] })
    // Clear all pending GitHub API requests
    githubRequestQueue.clear()
  }
}
