import { useInfiniteQuery } from '@tanstack/react-query'
import type { ReleaseItem, PullRequestItem, DiscussionItem } from '../types/github'
import type { PaginatedBatchResult } from '../server/github'

const GITHUB_KEY = 'github'
const UI_PAGE_SIZE = 30
const BATCH_SIZE = 100
const UI_PAGES_PER_BATCH = Math.ceil(BATCH_SIZE / UI_PAGE_SIZE) // 4

interface UseInfiniteDataResult<T> {
  data: T[]
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isLoading: boolean
  error: Error | null
}

// Calculate the batch page and UI page from a sequential page number
function calculatePagination(pageNum: number): { batchPage: number; uiPage: number } {
  const batchPage = Math.ceil(pageNum / UI_PAGES_PER_BATCH)
  const uiPage = ((pageNum - 1) % UI_PAGES_PER_BATCH) + 1
  return { batchPage, uiPage }
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
        `/api/github/${encodeURIComponent(repoId)}/releases?batchPage=${batchPage}&uiPage=${uiPage}`
      )
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to fetch releases')
      }
      return response.json()
    },
    getNextPageParam: (lastPage, allPages) => {
      // If there are more UI pages in this batch, increment by 1
      // If we need a new batch, the calculatePagination function will handle it
      if (lastPage.hasMore) {
        return allPages.length + 1
      }
      return undefined
    },
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
  } = useInfiniteQuery<PaginatedBatchResult<PullRequestItem>>({
    queryKey: [GITHUB_KEY, 'pullRequests', owner, repository],
    queryFn: async ({ pageParam = 1 }) => {
      const { batchPage, uiPage } = calculatePagination(pageParam as number)
      const response = await fetch(
        `/api/github/${encodeURIComponent(repoId)}/pull-requests?batchPage=${batchPage}&uiPage=${uiPage}`
      )
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to fetch pull requests')
      }
      return response.json()
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
      // pageParam is { cursor: string | null, uiPage: number }
      const params = (pageParam as { cursor: string | null; uiPage: number }) || { cursor: null, uiPage: 1 }
      const cursorParam = params.cursor ? `&cursor=${encodeURIComponent(params.cursor)}` : ''
      const response = await fetch(
        `/api/github/${encodeURIComponent(repoId)}/discussions?uiPage=${params.uiPage}${cursorParam}`
      )
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to fetch discussions')
      }
      return response.json()
    },
    getNextPageParam: (lastPage, allPages) => {
      // For discussions, we need to track cursor and UI page within batch
      const currentParams = allPages.length > 0 
        ? (allPages[allPages.length - 1] as PaginatedBatchResult<DiscussionItem>)
        : null
      
      if (!lastPage.hasMore) {
        return undefined
      }

      // Check if we have more UI pages in current batch
      if (lastPage.uiPage < UI_PAGES_PER_BATCH && lastPage.items.length === UI_PAGE_SIZE) {
        // More items available in current batch, just increment UI page
        return { 
          cursor: currentParams?.batchPage ? null : null, // Keep same cursor
          uiPage: lastPage.uiPage + 1 
        }
      }

      // Need to fetch next batch from GitHub
      // The server will provide the cursor for the next batch
      return { 
        cursor: lastPage.hasMore ? 'next' : null, // Server handles cursor
        uiPage: 1 
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!owner && !!repository,
    initialPageParam: { cursor: null, uiPage: 1 } as { cursor: string | null; uiPage: number },
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
