import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import { GitBranch, Loader2, CircleDot, Tag, GitPullRequest, MessageSquare } from 'lucide-react'
import { ReleaseList } from '../components/ReleaseList'
import { PullRequestList } from '../components/PullRequestList'
import { DashboardLayout } from '../components/DashboardLayout'
import { useRepository } from '../hooks/useRepositories'
import { useReleases, usePullRequests } from '../hooks/useGitHubData'
import { parseRepoId } from '../types/repository'
import { useSession } from '../hooks/useSession'
import { queryClient } from './__root'

export const Route = createFileRoute('/repo/$repoId')({
  component: RepositoryPage,
  onEnter: async ({ params }) => {
    const { repoId } = params
    const { owner, repository } = parseRepoId(repoId)
    // Invalidate queries for this repo to ensure high priority fetches when component mounts
    await queryClient.invalidateQueries({
      queryKey: ['github', 'releases', owner, repository],
    })
    await queryClient.invalidateQueries({
      queryKey: ['github', 'pullRequests', owner, repository],
    })
  },
})

type TabType = 'releases' | 'pullRequests' | 'discussions'

function RepositoryPage() {
  const { repoId } = Route.useParams()
  const { data: session, isLoading: isLoadingSession } = useSession()
  const { data: repository, isLoading: isLoadingRepo } = useRepository(repoId)
  const [activeTab, setActiveTab] = useState<TabType>('releases')
  const scrollPositions = useRef<Map<string, number>>(new Map())
  const prevKeyRef = useRef<string | null>(null)

  const getScrollKey = useCallback(() => `${repoId}:${activeTab}`, [repoId, activeTab])

  useEffect(() => {
    const key = getScrollKey()
    const prevKey = prevKeyRef.current

    if (prevKey) {
      const main = document.querySelector('main')
      if (main) scrollPositions.current.set(prevKey, main.scrollTop)
    }

    const main = document.querySelector('main')
    if (main) main.scrollTop = scrollPositions.current.get(key) ?? 0

    prevKeyRef.current = key
  }, [repoId, activeTab, getScrollKey])

  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    const onScroll = () => {
      const key = getScrollKey()
      scrollPositions.current.set(key, main.scrollTop)
    }
    main.addEventListener('scroll', onScroll, { passive: true })
    return () => main.removeEventListener('scroll', onScroll)
  }, [getScrollKey])

  const { owner, repository: repoName } = repository 
    ? { owner: repository.owner, repository: repository.repository }
    : parseRepoId(repoId)

  const { 
    data: releases, 
    fetchNextPage: fetchNextReleases,
    hasNextPage: hasNextReleases,
    isFetchingNextPage: isFetchingNextReleases,
    isLoading: isLoadingReleases,
    error: releasesError 
  } = useReleases(owner, repoName, { enabled: !!session })

  const { 
    data: pullRequests, 
    fetchNextPage: fetchNextPullRequests,
    hasNextPage: hasNextPullRequests,
    isFetchingNextPage: isFetchingNextPullRequests,
    isLoading: isLoadingPRs,
    error: prsError 
  } = usePullRequests(owner, repoName, { enabled: !!session })

  if (isLoadingSession) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--lagoon-deep)]" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return <Navigate to="/login" />
  }

  if (isLoadingRepo) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--lagoon-deep)]" />
        </div>
      </DashboardLayout>
    )
  }

  if (!repository) {
    return (
      <DashboardLayout>
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-[var(--sand)] p-4">
            <CircleDot className="h-8 w-8 text-[var(--sea-ink-soft)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--sea-ink)]">Repository not found</h2>
          <p className="mt-2 text-[var(--sea-ink-soft)]">
            The repository you're looking for doesn't exist.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  const isLoading = (activeTab === 'releases' && isLoadingReleases) || 
                    (activeTab === 'pullRequests' && isLoadingPRs)

  const tabs = [
    { id: 'releases' as TabType, label: 'Releases', icon: Tag },
    { id: 'pullRequests' as TabType, label: 'Pull Requests', icon: GitPullRequest },
    { id: 'discussions' as TabType, label: 'Discussions', icon: MessageSquare, disabled: true, subtitle: 'coming soon!' },
  ]

  const getError = () => {
    if (activeTab === 'releases' && releasesError) return releasesError
    if (activeTab === 'pullRequests' && prsError) return prsError
    return null
  }

  const error = getError()
  const errorMessage = error instanceof Error ? error.message : error ? 'Failed to load' : null

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 border-b border-[var(--line)] pb-3 sm:pb-4">
          <GitBranch className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--lagoon-deep)]" />
          <h1 className="text-base sm:text-lg font-semibold text-[var(--sea-ink)] truncate">
            {repository.owner}/{repository.repository}
          </h1>
        </div>

        <div className="mb-4 sm:mb-6 border-b border-[var(--line)]">
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id)}
                  disabled={tab.disabled}
                  className={`inline-flex flex-col items-center border-b-2 px-3 py-2 text-xs sm:text-sm sm:px-4 font-medium transition-colors whitespace-nowrap ${
                    tab.disabled
                      ? 'cursor-not-allowed border-transparent text-[var(--sea-ink-soft)] opacity-50'
                      : activeTab === tab.id
                        ? 'border-[var(--lagoon-deep)] text-[var(--lagoon-deep)]'
                        : 'border-transparent text-[var(--sea-ink-soft)] hover:border-[var(--line)] hover:text-[var(--sea-ink)]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <TabIcon className="h-4 w-4" />
                    {tab.label}
                  </span>
                  {tab.subtitle && (
                    <span className="text-xs opacity-60">{tab.subtitle}</span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
            <p>{errorMessage}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--lagoon-deep)]" />
          </div>
        )}

        {!isLoading && !errorMessage && activeTab === 'releases' && (
          <ReleaseList
            items={releases}
            hasNextPage={hasNextReleases}
            isFetchingNextPage={isFetchingNextReleases}
            onLoadMore={fetchNextReleases}
          />
        )}
        {!isLoading && !errorMessage && activeTab === 'pullRequests' && (
          <PullRequestList
            items={pullRequests}
            hasNextPage={hasNextPullRequests}
            isFetchingNextPage={isFetchingNextPullRequests}
            onLoadMore={fetchNextPullRequests}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
