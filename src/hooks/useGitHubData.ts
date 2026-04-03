import { useInfiniteQuery } from '@tanstack/react-query'
import type { ReleaseItem, PullRequestItem, DiscussionItem } from '../types/github'
import type { InfiniteScrollResult } from '../server/github'

const GITHUB_KEY = 'github'

interface UseInfiniteDataResult<T> {
  data: T[]
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isLoading: boolean
  error: Error | null
}

export function useReleases(
  owner: string,
  repository: string
): UseInfiniteDataResult<ReleaseItem> {
  const repoId = `${owner}/${repository}`
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery<InfiniteScrollResult<ReleaseItem>>({
    queryKey: [GITHUB_KEY, 'releases', owner, repository],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `/api/github/${encodeURIComponent(repoId)}/releases?page=${pageParam}`
      )
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to fetch releases')
      }
      return response.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
    enabled: !!owner && !!repository,
    initialPageParam: 1,
  })

  const allItems = data?.pages.flatMap((page) => page.items) ?? []

  return {
    data: allItems,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isLoading,
    error: error as Error | null,
  }
}

export function usePullRequests(
  owner: string,
  repository: string
): UseInfiniteDataResult<PullRequestItem> {
  const repoId = `${owner}/${repository}`
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery<InfiniteScrollResult<PullRequestItem>>({
    queryKey: [GITHUB_KEY, 'pullRequests', owner, repository],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `/api/github/${encodeURIComponent(repoId)}/pull-requests?page=${pageParam}`
      )
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to fetch pull requests')
      }
      return response.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
    enabled: !!owner && !!repository,
    initialPageParam: 1,
  })

  const allItems = data?.pages.flatMap((page) => page.items) ?? []

  return {
    data: allItems,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isLoading,
    error: error as Error | null,
  }
}

export function useDiscussions(
  owner: string,
  repository: string
): UseInfiniteDataResult<DiscussionItem> {
  const repoId = `${owner}/${repository}`
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery<InfiniteScrollResult<DiscussionItem>>({
    queryKey: [GITHUB_KEY, 'discussions', owner, repository],
    queryFn: async ({ pageParam = null }) => {
      const cursorParam = pageParam ? `&cursor=${encodeURIComponent(pageParam as string)}` : ''
      const response = await fetch(
        `/api/github/${encodeURIComponent(repoId)}/discussions?${cursorParam}`
      )
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to fetch discussions')
      }
      return response.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
    enabled: !!owner && !!repository,
    initialPageParam: null as string | null,
  })

  const allItems = data?.pages.flatMap((page) => page.items) ?? []

  return {
    data: allItems,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    isLoading,
    error: error as Error | null,
  }
}
