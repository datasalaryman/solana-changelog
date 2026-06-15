import { Tag, GitPullRequest, MessageSquare, ChevronRight, ChevronLeft } from 'lucide-react'

interface HorizontalSectionProps {
  title: string
  icon: 'releases' | 'pullRequests' | 'discussions'
  items: Array<{
    id: string
    title: string
    subtitle?: string
    status?: string
    date?: string
    url?: string
  }>
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

const iconMap = {
  releases: Tag,
  pullRequests: GitPullRequest,
  discussions: MessageSquare,
}

export function HorizontalSection({ 
  title, 
  icon, 
  items, 
  currentPage, 
  totalPages, 
  totalItems,
  onPageChange 
}: HorizontalSectionProps) {
  const Icon = iconMap[icon]

  // Calculate the range of page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  const startItem = (currentPage - 1) * 10 + 1
  const endItem = Math.min(currentPage * 10, totalItems)

  return (
    <section className="border-b border-[var(--line)] py-4 sm:py-6 last:border-b-0">
      <div className="mb-3 sm:mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--lagoon-deep)]" />
        <h2 className="font-semibold text-sm sm:text-base text-[var(--sea-ink)]">{title}</h2>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const content = (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm sm:text-base font-medium text-[var(--sea-ink)] group-hover:text-[var(--lagoon-deep)]">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="mt-0.5 truncate text-sm text-[var(--sea-ink-soft)]">
                    {item.subtitle}
                  </p>
                )}
              </div>
              <div className="ml-2 sm:ml-4 flex items-center gap-2 sm:gap-3 shrink-0">
                {item.status && (
                  <span className="rounded-full bg-[var(--palm)]/10 px-2 py-0.5 text-xs font-medium text-[var(--palm)]">
                    {item.status}
                  </span>
                )}
                {item.date && (
                  <span className="text-xs text-[var(--sea-ink-soft)]">
                    {item.date}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-[var(--sea-ink-soft)] opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </>
          )

          const className = "group flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 sm:px-3 sm:py-2.5 transition-colors hover:bg-[var(--link-bg-hover)]"

          if (item.url) {
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {content}
              </a>
            )
          }

          return (
            <div key={item.id} className={className}>
              {content}
            </div>
          )
        })}
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-[var(--sea-ink-soft)]">
            No {title.toLowerCase()} found
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 sm:mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-[var(--sand)]/50 px-3 py-2.5">
          <span className="text-xs text-[var(--sea-ink-soft)] text-center">
            Showing {startItem}-{endItem} of {totalItems}
          </span>
          
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            
            {getPageNumbers().map((page, index) => (
              typeof page === 'number' ? (
                <button
                  key={index}
                  onClick={() => onPageChange(page)}
                  className={`flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 text-xs font-medium transition ${
                    page === currentPage
                      ? 'bg-[var(--lagoon)]/10 text-[var(--lagoon-deep)] border border-[var(--lagoon)]/30'
                      : 'border border-[var(--line)] bg-[var(--surface)] text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]'
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={index} className="px-1 text-xs text-[var(--sea-ink-soft)]">
                  {page}
                </span>
              )
            ))}
            
            <button
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
