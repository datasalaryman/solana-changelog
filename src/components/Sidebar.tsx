import { Link, useParams } from '@tanstack/react-router'
import { GitBranch, Loader2 } from 'lucide-react'
import { useRepositories } from '../hooks/useRepositories'

export function Sidebar() {
  const { data: repositories, isLoading, error } = useRepositories()
  const params = useParams({ strict: false })
  const currentRepoId = params.repoId as string | undefined

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-r border-[var(--line)] bg-[var(--surface)] backdrop-blur-sm">
      <div className="flex h-12 flex-shrink-0 items-center border-b border-[var(--line)] px-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-[var(--lagoon)] to-[var(--palm)]">
            <GitBranch className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-[var(--sea-ink)]">Repositories</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--lagoon-deep)]" />
          </div>
        )}

        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
            Failed to load
          </div>
        )}

        {repositories && (
          <ul className="space-y-0.5">
            {repositories.map((repo) => {
              const isActive = currentRepoId === repo.id
              return (
                <li key={repo.id}>
                  <Link
                    to="/repo/$repoId"
                    params={{ repoId: repo.id }}
                    className={`block rounded-md px-2.5 py-2 text-[13px] leading-snug transition-all ${
                      isActive
                        ? 'bg-[var(--lagoon)]/10 text-[var(--lagoon-deep)] font-medium'
                        : 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]'
                    }`}
                  >
                    <span className="block truncate">
                      <span className="opacity-60">{repo.owner}/</span>
                      <span className={isActive ? 'text-[var(--lagoon-deep)]' : ''}>
                        {repo.repository}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </nav>
    </aside>
  )
}
