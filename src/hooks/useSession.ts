import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authClient } from '../lib/auth-client'

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const result = await authClient.getSession()
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()
  
  return async () => {
    await authClient.signOut()
    // Remove session data from cache
    queryClient.removeQueries({ queryKey: ['session'] })
  }
}
