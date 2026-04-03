import { useEffect, useRef, useCallback } from 'react'
import { ChevronRight, Loader2 } from 'lucide-react'
import type { PullRequestItem } from '../types/github'

interface PullRequestListProps {
  items: PullRequestItem[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'merged':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'closed':
      return 'bg-red-100 text-red-700 border-red-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function PullRequestList({
  items,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: PullRequestListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        onLoadMore()
      }
    },
    [hasNextPage, isFetchingNextPage, onLoadMore]
  )

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element) return

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    })

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleObserver])

  return (
    <section>
      <div className="space-y-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--link-bg-hover)]"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[var(--sea-ink)] group-hover:text-[var(--lagoon-deep)]">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="mt-0.5 truncate text-sm text-[var(--sea-ink-soft)]">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="ml-4 flex items-center gap-3">
              {item.date && (
                <span className="text-xs text-[var(--sea-ink-soft)]">
                  {item.date}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-[var(--sea-ink-soft)] opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </a>
        ))}
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-[var(--sea-ink-soft)]">
            No pull requests found
          </p>
        </div>
      )}

      {/* Load more trigger */}
      <div
        ref={loadMoreRef}
        className="mt-4 flex items-center justify-center py-4"
      >
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-sm text-[var(--sea-ink-soft)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more...
          </div>
        )}
        {!hasNextPage && items.length > 0 && (
          <span className="text-xs text-[var(--sea-ink-soft)]">
            No more items
          </span>
        )}
      </div>
    </section>
  )
}
