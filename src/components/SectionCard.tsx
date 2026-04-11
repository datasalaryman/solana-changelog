import { Tag, GitPullRequest, MessageSquare, ChevronRight } from 'lucide-react'

interface SectionCardProps {
  title: string
  icon: 'releases' | 'pullRequests' | 'discussions'
  count?: number
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

export function SectionCard({ title, icon, count, items }: SectionCardProps) {
  const Icon = iconMap[icon]

  return (
    <div className="island-shell rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--lagoon-deep)] shrink-0" />
          <h2 className="font-semibold text-sm sm:text-base text-[var(--sea-ink)] truncate">{title}</h2>
        </div>
        {count !== undefined && (
          <span className="rounded-full bg-[var(--lagoon)]/10 px-2.5 py-0.5 text-sm font-medium text-[var(--lagoon-deep)]">
            {count}
          </span>
        )}
      </div>

      <div className="divide-y divide-[var(--line)]">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex cursor-pointer items-center justify-between px-3 py-3 sm:px-5 transition-colors hover:bg-[var(--link-bg-hover)]"
          >
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
            <div className="ml-3 sm:ml-4 flex items-center gap-2 sm:gap-3 shrink-0">
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
        <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
          <div className="mb-3 rounded-full bg-[var(--sand)] p-3">
            <Icon className="h-6 w-6 text-[var(--sea-ink-soft)]" />
          </div>
          <p className="text-sm text-[var(--sea-ink-soft)]">
            No {title.toLowerCase()} found
          </p>
        </div>
      )}
    </div>
  )
}
