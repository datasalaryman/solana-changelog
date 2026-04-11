import { useEffect, useRef, useCallback, useState } from 'react'
import { Loader2, Copy, Link2, Check } from 'lucide-react'
import type { ReleaseItem } from '../types/github'
import { formatUTC } from '../lib/utils'

interface ReleaseListProps {
  items: ReleaseItem[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
}

interface TooltipButtonProps {
  children: React.ReactNode
  tooltip: string
  onClick: (e: React.MouseEvent) => void
}

function TooltipButton({ children, tooltip, onClick }: TooltipButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--sea-ink-soft)] transition-colors hover:bg-[var(--sand)] hover:text-[var(--sea-ink)]"
      >
        {children}
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TooltipButton tooltip="Copy title to clipboard" onClick={handleCopy}>
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </TooltipButton>
  )
}

function LinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TooltipButton tooltip="Copy GitHub link to clipboard" onClick={handleCopy}>
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Link2 className="h-3.5 w-3.5" />}
    </TooltipButton>
  )
}

interface DateTooltipProps {
  date: string
  originalDate: string
}

function DateTooltip({ date, originalDate }: DateTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-default"
      >
        {date}
      </span>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
          {formatUTC(originalDate)}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
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
                  <DateTooltip date={item.date} originalDate={item.originalDate} />
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
