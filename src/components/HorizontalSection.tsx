import { Tag, GitPullRequest, MessageSquare, ChevronRight } from 'lucide-react'

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
}

const iconMap = {
  releases: Tag,
  pullRequests: GitPullRequest,
  discussions: MessageSquare,
}

export function HorizontalSection({ title, icon, items }: HorizontalSectionProps) {
  const Icon = iconMap[icon]

  return (
    <section className="border-b border-[var(--line)] py-6 last:border-b-0">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-[var(--lagoon-deep)]" />
        <h2 className="font-semibold text-[var(--sea-ink)]">{title}</h2>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const content = (
            <>
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
            </>
          )

          const className = "group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--link-bg-hover)]"

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

      {/* Showing count */}
      {items.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-[var(--sand)]/50 px-3 py-2.5">
          <span className="text-xs text-[var(--sea-ink-soft)]">
            Showing {items.length} recent items
          </span>
        </div>
      )}
    </section>
  )
}