import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Github, Loader2, CircleDot, Tag, GitPullRequest, MessageSquare } from 'lucide-react'
import { ReleaseList } from '../components/ReleaseList'
import { PullRequestList } from '../components/PullRequestList'
import { DiscussionList } from '../components/DiscussionList'
import { DashboardLayout } from '../components/DashboardLayout'
import { useRepository } from '../hooks/useRepositories'
import { useReleases, usePullRequests, useDiscussions } from '../hooks/useGitHubData'
import { parseRepoId } from '../types/repository'

export const Route = createFileRoute('/repo/$repoId')({
  component: RepositoryPage,
})

type TabType = 'releases' | 'pullRequests' | 'discussions'

function RepositoryPage() {
  const { repoId } = Route.useParams()
  const { data: repository, isLoading: isLoadingRepo } = useRepository(repoId)
  const [activeTab, setActiveTab] = useState<TabType>('releases')

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
  } = useReleases(owner, repoName)

  const { 
    data: pullRequests, 
    fetchNextPage: fetchNextPullRequests,
    hasNextPage: hasNextPullRequests,
    isFetchingNextPage: isFetchingNextPullRequests,
    isLoading: isLoadingPRs,
    error: prsError 
  } = usePullRequests(owner, repoName)

  const { 
    data: discussions, 
    fetchNextPage: fetchNextDiscussions,
    hasNextPage: hasNextDiscussions,
    isFetchingNextPage: isFetchingNextDiscussions,
    isLoading: isLoadingDiscussions,
    error: discussionsError 
  } = useDiscussions(owner, repoName)

  const isLoading = isLoadingRepo || (activeTab === 'releases' && isLoadingReleases) || 
                    (activeTab === 'pullRequests' && isLoadingPRs) || 
                    (activeTab === 'discussions' && isLoadingDiscussions)

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

  const tabs = [
    { id: 'releases' as TabType, label: 'Releases', icon: Tag },
    { id: 'pullRequests' as TabType, label: 'Pull Requests', icon: GitPullRequest },
    { id: 'discussions' as TabType, label: 'Discussions', icon: MessageSquare },
  ]

  const getError = () => {
    if (activeTab === 'releases' && releasesError) return releasesError
    if (activeTab === 'pullRequests' && prsError) return prsError
    if (activeTab === 'discussions' && discussionsError) return discussionsError
    return null
  }

  const error = getError()
  const errorMessage = error instanceof Error ? error.message : error ? 'Failed to load' : null

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        {/* Compact Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-[var(--line)] pb-4">
          <Github className="h-5 w-5 text-[var(--lagoon-deep)]" />
          <h1 className="text-lg font-semibold text-[var(--sea-ink)]">
            {repository.owner}/{repository.repository}
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-[var(--line)]">
          <nav className="-mb-px flex gap-1">
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-[var(--lagoon-deep)] text-[var(--lagoon-deep)]'
                      : 'border-transparent text-[var(--sea-ink-soft)] hover:border-[var(--line)] hover:text-[var(--sea-ink)]'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
            <p>{errorMessage}</p>
            {activeTab === 'discussions' && (
              <p className="mt-1 text-xs opacity-75">
                Note: Discussions require a GitHub token. Some repositories may not have discussions enabled.
              </p>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--lagoon-deep)]" />
          </div>
        )}

        {/* Active Tab Content */}
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
        {!isLoading && !errorMessage && activeTab === 'discussions' && (
          <DiscussionList
            items={discussions}
            hasNextPage={hasNextDiscussions}
            isFetchingNextPage={isFetchingNextDiscussions}
            onLoadMore={fetchNextDiscussions}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
