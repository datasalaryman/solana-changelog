import { safe } from '@orpc/client'
import { useInfiniteQuery } from '@tanstack/react-query'
import type { ReleaseItem, PullRequestItem, DiscussionItem } from '../types/github'
import type { PaginatedBatchResult } from '../server/github'
import { githubRequestQueue } from '../lib/requestQueue'
import { orpc } from '../lib/orpc'
import { startReauth } from '../lib/reauth'

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
  isRefreshing: boolean
  isStaleDueToError: boolean
  error: Error | null
}

function calculatePagination(pageNum: number): { batchPage: number; uiPage: number } {
  const batchPage = Math.ceil(pageNum / UI_PAGES_PER_BATCH)
  const uiPage = ((pageNum - 1) % UI_PAGES_PER_BATCH) + 1
  return { batchPage, uiPage }
}

function mergeItems<T extends { id: string; originalDate: string }>(cachedItems: T[], freshItems: T[]): T[] {
  const merged = new Map<string, T>()

  for (const item of cachedItems) {
    merged.set(item.id, item)
  }

  for (const item of freshItems) {
    merged.set(item.id, item)
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.originalDate).getTime() - new Date(a.originalDate).getTime()
  )
}

class ReauthRequiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReauthRequiredError'
  }
}

async function queueCall<T>(key: string, call: () => Promise<T>, priority: 'high' | 'low' = 'low'): Promise<T> {
  try {
    return await githubRequestQueue.add(
      key,
      async () => {
        const [error, data] = await safe(call())

        if (error) {
          const rpcError = error as { code?: string; message?: string }

          if (rpcError.code === 'REAUTH_REQUIRED') {
            throw new ReauthRequiredError(rpcError.message || 'Reauthorization required')
          }

          throw error
        }

        return data
      },
      priority
    )
  } catch (error) {
    if (error instanceof ReauthRequiredError) {
      return startReauth()
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

  const cachedQuery = useInfiniteQuery<PaginatedBatchResult<ReleaseItem>>({
    queryKey: [GITHUB_KEY, 'db', 'releases', owner, repository],
    queryFn: async ({ pageParam = 1 }) => {
      const { batchPage, uiPage } = calculatePagination(pageParam as number)
      return orpc.github.cachedReleases({ owner, repository, batchPage, uiPage })
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
  })

  const freshQuery = useInfiniteQuery<PaginatedBatchResult<ReleaseItem>>({
    queryKey: [GITHUB_KEY, 'fresh', 'releases', owner, repository],
    queryFn: async ({ pageParam = 1 }) => {
      const { batchPage, uiPage } = calculatePagination(pageParam as number)
      const key = `releases:${repoId}:${batchPage}:${uiPage}`
      return queueCall(key, () => orpc.github.releases({ owner, repository, batchPage, uiPage }), 'high')
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
        return false
      }
      return failureCount < 3
    },
  })

  const cachedItems = cachedQuery.data?.pages.flatMap((page) => page.items) ?? []
  const freshItems = freshQuery.data?.pages.flatMap((page) => page.items) ?? []
  const allItems = mergeItems(cachedItems, freshItems)

  return {
    data: allItems,
    fetchNextPage: () => {
      if (cachedQuery.hasNextPage) cachedQuery.fetchNextPage()
      if (freshQuery.hasNextPage) freshQuery.fetchNextPage()
    },
    hasNextPage: (cachedQuery.hasNextPage ?? false) || (freshQuery.hasNextPage ?? false),
    isFetchingNextPage: cachedQuery.isFetchingNextPage || freshQuery.isFetchingNextPage,
    isLoading: allItems.length === 0 && (cachedQuery.isLoading || freshQuery.isFetching),
    isRefreshing: freshQuery.isFetching,
    isStaleDueToError: !!freshQuery.error && cachedItems.length > 0,
    error: allItems.length === 0 ? ((cachedQuery.error ?? freshQuery.error) as Error | null) : null,
  }
}

export function usePullRequests(
  owner: string,
  repository: string,
  options?: { enabled?: boolean }
): UseInfiniteDataResult<PullRequestItem> {
  const repoId = `${owner}/${repository}`

  const cachedQuery = useInfiniteQuery<PaginatedBatchResult<PullRequestItem>>({
    queryKey: [GITHUB_KEY, 'db', 'pullRequests', owner, repository],
    queryFn: async ({ pageParam = 1 }) => {
      const { batchPage, uiPage } = calculatePagination(pageParam as number)
      return orpc.github.cachedPullRequests({ owner, repository, batchPage, uiPage })
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
  })

  const freshQuery = useInfiniteQuery<PaginatedBatchResult<PullRequestItem>>({
    queryKey: [GITHUB_KEY, 'fresh', 'pullRequests', owner, repository],
    queryFn: async ({ pageParam = 1 }) => {
      const { batchPage, uiPage } = calculatePagination(pageParam as number)
      const key = `pull-requests:${repoId}:${batchPage}:${uiPage}`
      return queueCall(key, () => orpc.github.pullRequests({ owner, repository, batchPage, uiPage }), 'high')
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
        return false
      }
      return failureCount < 3
    },
  })

  const cachedItems = cachedQuery.data?.pages.flatMap((page) => page.items) ?? []
  const freshItems = freshQuery.data?.pages.flatMap((page) => page.items) ?? []
  const allItems = mergeItems(cachedItems, freshItems)

  return {
    data: allItems,
    fetchNextPage: () => {
      if (cachedQuery.hasNextPage) cachedQuery.fetchNextPage()
      if (freshQuery.hasNextPage) freshQuery.fetchNextPage()
    },
    hasNextPage: (cachedQuery.hasNextPage ?? false) || (freshQuery.hasNextPage ?? false),
    isFetchingNextPage: cachedQuery.isFetchingNextPage || freshQuery.isFetchingNextPage,
    isLoading: allItems.length === 0 && (cachedQuery.isLoading || freshQuery.isFetching),
    isRefreshing: freshQuery.isFetching,
    isStaleDueToError: !!freshQuery.error && cachedItems.length > 0,
    error: allItems.length === 0 ? ((cachedQuery.error ?? freshQuery.error) as Error | null) : null,
  }
}

export function useDiscussions(
  owner: string,
  repository: string,
  options?: { enabled?: boolean }
): UseInfiniteDataResult<DiscussionItem> {
  const repoId = `${owner}/${repository}`

  const cachedQuery = useInfiniteQuery<PaginatedBatchResult<DiscussionItem>>({
    queryKey: [GITHUB_KEY, 'db', 'discussions', owner, repository],
    queryFn: async ({ pageParam = 1 }) => {
      return orpc.github.cachedDiscussions({ owner, repository, cursor: null, uiPage: pageParam as number })
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
  })

  const freshQuery = useInfiniteQuery<PaginatedBatchResult<DiscussionItem>>({
    queryKey: [GITHUB_KEY, 'fresh', 'discussions', owner, repository],
    queryFn: async ({ pageParam }) => {
      const params = (pageParam as { cursor: string | null; uiPage: number }) || { cursor: null, uiPage: 1 }
      const key = `discussions:${repoId}:${params.cursor ?? ''}:${params.uiPage}`
      return queueCall(
        key,
        () => orpc.github.discussions({ owner, repository, cursor: params.cursor, uiPage: params.uiPage }),
        'high'
      )
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
        return false
      }
      return failureCount < 3
    },
  })

  const cachedItems = cachedQuery.data?.pages.flatMap((page) => page.items) ?? []
  const freshItems = freshQuery.data?.pages.flatMap((page) => page.items) ?? []
  const allItems = mergeItems(cachedItems, freshItems)

  return {
    data: allItems,
    fetchNextPage: () => {
      if (cachedQuery.hasNextPage) cachedQuery.fetchNextPage()
      if (freshQuery.hasNextPage) freshQuery.fetchNextPage()
    },
    hasNextPage: (cachedQuery.hasNextPage ?? false) || (freshQuery.hasNextPage ?? false),
    isFetchingNextPage: cachedQuery.isFetchingNextPage || freshQuery.isFetchingNextPage,
    isLoading: allItems.length === 0 && (cachedQuery.isLoading || freshQuery.isFetching),
    isRefreshing: freshQuery.isFetching,
    isStaleDueToError: !!freshQuery.error && cachedItems.length > 0,
    error: allItems.length === 0 ? ((cachedQuery.error ?? freshQuery.error) as Error | null) : null,
  }
}

export { ReauthRequiredError }
