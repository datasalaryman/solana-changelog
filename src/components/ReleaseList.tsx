import { useEffect, useRef, useCallback } from 'react'
import { Loader2, Copy, Link2 } from 'lucide-react'
import type { ReleaseItem } from '../types/github'

interface ReleaseListProps {
  items: ReleaseItem[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
}

function CopyButton({ text }: { text: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    const btn = e.currentTarget as HTMLButtonElement
    btn.innerHTML = '<svg class="h-3.5 w-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
    setTimeout(() => {
      btn.innerHTML = '<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>'
    }, 2000)
  }

  return (
    <button
      onClick={handleClick}
      title="Copy title to clipboard"
      className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--sea-ink-soft)] transition-colors hover:bg-[var(--sand)] hover:text-[var(--sea-ink)]"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  )
}

function LinkButton({ url }: { url: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(url)
    const btn = e.currentTarget as HTMLButtonElement
    btn.innerHTML = '<svg class="h-3.5 w-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
    setTimeout(() => {
      btn.innerHTML = '<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>'
    }, 2000)
  }

  return (
    <button
      onClick={handleClick}
      title="Copy GitHub link to clipboard"
      className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--sea-ink-soft)] transition-colors hover:bg-[var(--sand)] hover:text-[var(--sea-ink)]"
    >
      <Link2 className="h-3.5 w-3.5" />
    </button>
  )
}

export function ReleaseList({
  items,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: ReleaseListProps) {
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

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
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
              <span className="flex-shrink-0 rounded-full border bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 border-blue-200">
                Release
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
            <div className="ml-4 flex items-center gap-1">
              {item.date && (
                <span className="mr-2 text-xs text-[var(--sea-ink-soft)]">
                  {item.date}
                </span>
              )}
              <CopyButton text={item.title} />
              <LinkButton url={item.url} />
            </div>
          </a>
        ))}
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-[var(--sea-ink-soft)]">
            No releases found
          </p>
        </div>
      )}

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
