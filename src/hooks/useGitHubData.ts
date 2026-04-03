import { useQuery } from '@tanstack/react-query'
import type { ReleaseItem, PullRequestItem, DiscussionItem } from '../types/github'

const GITHUB_KEY = 'github'

export function useReleases(owner: string, repository: string) {
  const repoId = `${owner}/${repository}`
  return useQuery<ReleaseItem[]>({
    queryKey: [GITHUB_KEY, 'releases', owner, repository],
    queryFn: async () => {
      const response = await fetch(`/api/github/${encodeURIComponent(repoId)}/releases`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch releases')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!owner && !!repository,
  })
}

export function usePullRequests(owner: string, repository: string) {
  const repoId = `${owner}/${repository}`
  return useQuery<PullRequestItem[]>({
    queryKey: [GITHUB_KEY, 'pullRequests', owner, repository],
    queryFn: async () => {
      const response = await fetch(`/api/github/${encodeURIComponent(repoId)}/pull-requests`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch pull requests')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!owner && !!repository,
  })
}

export function useDiscussions(owner: string, repository: string) {
  const repoId = `${owner}/${repository}`
  return useQuery<DiscussionItem[]>({
    queryKey: [GITHUB_KEY, 'discussions', owner, repository],
    queryFn: async () => {
      const response = await fetch(`/api/github/${encodeURIComponent(repoId)}/discussions`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch discussions')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!owner && !!repository,
  })
}
