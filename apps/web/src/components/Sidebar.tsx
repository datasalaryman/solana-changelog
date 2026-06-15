import { Link, useParams } from '@tanstack/react-router'
import { GitBranch, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useRepositories } from '../hooks/useRepositories'
import { useSidebar } from '../context/SidebarContext'
import { useSession } from '../hooks/useSession'
import type { RepositoryWithId } from '../types/repository'

function RepoLink({ repo, isActive }: { repo: RepositoryWithId; isActive: boolean }) {
  const { close } = useSidebar()

  return (
    <Link
      to="/repo/$repoId"
      params={{ repoId: repo.id }}
      onClick={() => close()}
      className={`block rounded-md px-2.5 py-2 text-base md:text-[13px] md:leading-snug transition-all ${
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
  )
}

export function Sidebar() {
  const { data: session } = useSession()
  const { data: repositories, isLoading, error } = useRepositories({ enabled: !!session })
  const params = useParams({ strict: false })
  const currentRepoId = params.repoId as string | undefined
  const { isOpen, close } = useSidebar()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-full flex-col border-r border-[var(--line)] bg-[var(--surface)] backdrop-blur-sm transition-transform duration-200 ease-in-out md:static md:inset-auto md:z-auto md:translate-x-0 md:w-60 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center border-b border-[var(--line)] px-3 md:h-12">
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
                    <RepoLink repo={repo} isActive={isActive} />
                  </li>
                )
              })}
            </ul>
          )}
        </nav>
      </aside>
    </>
  )
}
