import { useInfiniteQuery } from '@tanstack/react-query'
import type { ReleaseItem, PullRequestItem, DiscussionItem } from '../types/github'
import type { PaginatedBatchResult } from '../server/github'

const GITHUB_KEY = 'github'
const UI_PAGE_SIZE = 30
const BATCH_SIZE = 100
const UI_PAGES_PER_BATCH = Math.ceil(BATCH_SIZE / UI_PAGE_SIZE)

interface UseInfiniteDataResult<T> {
  data: T[]
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isLoading: boolean
  error: Error | null
}

function calculatePagination(pageNum: number): { batchPage: number; uiPage: number } {
  const batchPage = Math.ceil(pageNum / UI_PAGES_PER_BATCH)
  const uiPage = ((pageNum - 1) % UI_PAGES_PER_BATCH) + 1
  return { batchPage, uiPage }
}

class ReauthRequiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReauthRequiredError'
  }
}

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const err = await response.json()
    if (err.code === 'REAUTH_REQUIRED') {
      throw new ReauthRequiredError(err.error || 'Reauthorization required')
    }
    throw new Error(err.error || 'API request failed')
  }
  return response.json()
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
  } = useInfiniteQuery<PaginatedBatchResult<ReleaseItem>>({
    queryKey: [GITHUB_KEY, 'releases', owner, repository],
    queryFn: async ({ pageParam = 1 }) => {
      const { batchPage, uiPage } = calculatePagination(pageParam as number)
      const response = await fetch(
        `/api/github/${encodeURIComponent(repoId)}/releases?batchPage=${batchPage}&uiPage=${uiPage}`,
        { credentials: 'include' }
      )
      return handleApiResponse<PaginatedBatchResult<ReleaseItem>>(response)
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length + 1
      }
      return undefined
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!owner && !!repository,
    initialPageParam: 1,
    retry: (failureCount, error) => {
      if (error instanceof ReauthRequiredError) {
        return false
      }
      return failureCount < 3
    },
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
  } = useInfiniteQuery<PaginatedBatchResult<PullRequestItem>>({
    queryKey: [GITHUB_KEY, 'pullRequests', owner, repository],
    queryFn: async ({ pageParam = 1 }) => {
      const { batchPage, uiPage } = calculatePagination(pageParam as number)
      const response = await fetch(
        `/api/github/${encodeURIComponent(repoId)}/pull-requests?batchPage=${batchPage}&uiPage=${uiPage}`,
        { credentials: 'include' }
      )
      return handleApiResponse<PaginatedBatchResult<PullRequestItem>>(response)
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length + 1
      }
      return undefined
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!owner && !!repository,
    initialPageParam: 1,
    retry: (failureCount, error) => {
      if (error instanceof ReauthRequiredError) {
        return false
      }
      return failureCount < 3
    },
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
  } = useInfiniteQuery<PaginatedBatchResult<DiscussionItem>>({
    queryKey: [GITHUB_KEY, 'discussions', owner, repository],
    queryFn: async ({ pageParam }) => {
      const params = (pageParam as { cursor: string | null; uiPage: number }) || { cursor: null, uiPage: 1 }
      const cursorParam = params.cursor ? `&cursor=${encodeURIComponent(params.cursor)}` : ''
      const response = await fetch(
        `/api/github/${encodeURIComponent(repoId)}/discussions?uiPage=${params.uiPage}${cursorParam}`
      )
      return handleApiResponse<PaginatedBatchResult<DiscussionItem>>(response)
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentParams = allPages.length > 0 
        ? (allPages[allPages.length - 1] as PaginatedBatchResult<DiscussionItem>)
        : null
      
      if (!lastPage.hasMore) {
        return undefined
      }

      if (lastPage.uiPage < UI_PAGES_PER_BATCH && lastPage.items.length === UI_PAGE_SIZE) {
        return { 
          cursor: currentParams?.batchPage ? null : null,
          uiPage: lastPage.uiPage + 1 
        }
      }

      return { 
        cursor: lastPage.hasMore ? 'next' : null,
        uiPage: 1 
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!owner && !!repository,
    initialPageParam: { cursor: null, uiPage: 1 } as { cursor: string | null; uiPage: number },
    retry: (failureCount, error) => {
      if (error instanceof ReauthRequiredError) {
        return false
      }
      return failureCount < 3
    },
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

export { ReauthRequiredError }