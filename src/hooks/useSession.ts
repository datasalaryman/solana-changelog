import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authClient } from '../lib/auth-client'

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const result = await authClient.getSession()
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
    queryClient.removeQueries({ queryKey: ['session'] })
  }
}
