import { useInfiniteQuery, QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'
import type { ReleaseItem, PullRequestItem, DiscussionItem } from '../types/github'
import type { PaginatedBatchResult } from '../server/github'
import { githubRequestQueue } from '../lib/requestQueue'
import { queryClient } from '../routes/__root'

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

// Global handler for reauth errors - clears credentials and redirects
function handleReauthError(): never {
  // Clear all queries from cache
  queryClient.clear()
  // Throw redirect to login page
  throw redirect({
    to: '/login',
    search: {
      reauth: true,
    },
  })
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

async function queueFetch<T>(url: string, priority: 'high' | 'low' = 'low'): Promise<T> {
  try {
    return await githubRequestQueue.add(
      url,
      async () => {
        const response = await fetch(url, { credentials: 'include' })
        return handleApiResponse<T>(response)
      },
      priority
    )
  } catch (error) {
    if (error instanceof ReauthRequiredError) {
      handleReauthError()
    }
    throw error
  }
}

export function useReleases(
  owner: string,
  repository: string,
  options?: { enabled?: boolean }
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
      const url = `/api/github/${encodeURIComponent(repoId)}/releases?batchPage=${batchPage}&uiPage=${uiPage}`
      return queueFetch<PaginatedBatchResult<ReleaseItem>>(url, 'high')
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length + 1
      }
      return undefined
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!owner && !!repository && options?.enabled !== false,
    initialPageParam: 1,
    retry: (failureCount, error) => {
      if (error instanceof ReauthRequiredError) {
        handleReauthError()
      }
      return failureCount < 3
    },
  })

  // Check for reauth error after query completes
  if (error instanceof ReauthRequiredError) {
    handleReauthError()
  }

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
  repository: string,
  options?: { enabled?: boolean }
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
      const url = `/api/github/${encodeURIComponent(repoId)}/pull-requests?batchPage=${batchPage}&uiPage=${uiPage}`
      return queueFetch<PaginatedBatchResult<PullRequestItem>>(url, 'high')
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length + 1
      }
      return undefined
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!owner && !!repository && options?.enabled !== false,
    initialPageParam: 1,
    retry: (failureCount, error) => {
      if (error instanceof ReauthRequiredError) {
        handleReauthError()
      }
      return failureCount < 3
    },
  })

  // Check for reauth error after query completes
  if (error instanceof ReauthRequiredError) {
    handleReauthError()
  }

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
  repository: string,
  options?: { enabled?: boolean }
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
      const url = `/api/github/${encodeURIComponent(repoId)}/discussions?uiPage=${params.uiPage}${cursorParam}`
      return queueFetch<PaginatedBatchResult<DiscussionItem>>(url, 'high')
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
    enabled: !!owner && !!repository && options?.enabled !== false,
    initialPageParam: { cursor: null, uiPage: 1 } as { cursor: string | null; uiPage: number },
    retry: (failureCount, error) => {
      if (error instanceof ReauthRequiredError) {
        handleReauthError()
      }
      return failureCount < 3
    },
  })

  // Check for reauth error after query completes
  if (error instanceof ReauthRequiredError) {
    handleReauthError()
  }

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

export function createPrefetchFunctions(queryClient: QueryClient) {
  return {
    prefetchRepoData: async (owner: string, repository: string, priority: 'high' | 'low' = 'low'): Promise<void> => {
      const repoId = `${owner}/${repository}`

      try {
        await Promise.all([
          (async () => {
            const { batchPage, uiPage } = calculatePagination(1)
            const url = `/api/github/${encodeURIComponent(repoId)}/releases?batchPage=${batchPage}&uiPage=${uiPage}`

            // Always add to queue to allow priority upgrades
            const data = await queueFetch<PaginatedBatchResult<ReleaseItem>>(url, priority)

            // Update TanStack Query cache with the result
            queryClient.setQueryData(
              [GITHUB_KEY, 'releases', owner, repository],
              (oldData: { pages: PaginatedBatchResult<ReleaseItem>[]; pageParams: number[] } | undefined) => {
                if (oldData) {
                  return {
                    ...oldData,
                    pages: [data, ...oldData.pages.slice(1)],
                  }
                }
                return {
                  pages: [data],
                  pageParams: [1],
                }
              }
            )
          })(),
          (async () => {
            const { batchPage, uiPage } = calculatePagination(1)
            const url = `/api/github/${encodeURIComponent(repoId)}/pull-requests?batchPage=${batchPage}&uiPage=${uiPage}`

            // Always add to queue to allow priority upgrades
            const data = await queueFetch<PaginatedBatchResult<PullRequestItem>>(url, priority)

            // Update TanStack Query cache with the result
            queryClient.setQueryData(
              [GITHUB_KEY, 'pullRequests', owner, repository],
              (oldData: { pages: PaginatedBatchResult<PullRequestItem>[]; pageParams: number[] } | undefined) => {
                if (oldData) {
                  return {
                    ...oldData,
                    pages: [data, ...oldData.pages.slice(1)],
                  }
                }
                return {
                  pages: [data],
                  pageParams: [1],
                }
              }
            )
          })(),
        ])
      } catch (error) {
        if (error instanceof ReauthRequiredError) {
          handleReauthError()
        }
        throw error
      }
    },
  }
}

export { ReauthRequiredError }