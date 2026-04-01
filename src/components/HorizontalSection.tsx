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
  }>
}

const iconMap = {
  releases: Tag,
  pullRequests: GitPullRequest,
  discussions: MessageSquare,
}

export function HorizontalSection({ title, icon, items }: HorizontalSectionProps) {
  const Icon = iconMap[icon]
  const currentPage: number = 1
  const totalPages = 5
  const totalItems = 42

  return (
    <section className="border-b border-[var(--line)] py-6 last:border-b-0">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-[var(--lagoon-deep)]" />
        <h2 className="font-semibold text-[var(--sea-ink)]">{title}</h2>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--link-bg-hover)]"
          >
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
            <div className="ml-4 flex items-center gap-3">
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
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-[var(--sea-ink-soft)]">
            No {title.toLowerCase()} found
          </p>
        </div>
      )}

      {/* Pagination */}
      {items.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-[var(--sand)]/50 px-3 py-2.5">
          <span className="text-xs text-[var(--sea-ink-soft)]">
            Showing {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalItems)} of {totalItems}
          </span>
          
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => {}}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 text-xs font-medium transition ${
                  page === currentPage
                    ? 'bg-[var(--lagoon)]/10 text-[var(--lagoon-deep)] border border-[var(--lagoon)]/30'
                    : 'border border-[var(--line)] bg-[var(--surface)] text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]'
                }`}
                onClick={() => {}}
              >
                {page}
              </button>
            ))}
            
            <button
              disabled={currentPage === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => {}}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}