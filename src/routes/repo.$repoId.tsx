import { createFileRoute } from '@tanstack/react-router'
import { Github, Loader2, CircleDot } from 'lucide-react'
import { HorizontalSection } from '../components/HorizontalSection'
import { DashboardLayout } from '../components/DashboardLayout'
import { useRepository } from '../hooks/useRepositories'

export const Route = createFileRoute('/repo/$repoId')({
  component: RepositoryPage,
})

// Dummy data for the three sections
const dummyReleases = [
  { id: '1', title: 'v2.1.0', subtitle: 'Major performance improvements', date: '2 days ago' },
  { id: '2', title: 'v2.0.5', subtitle: 'Bug fixes and security patches', date: '1 week ago' },
  { id: '3', title: 'v2.0.0', subtitle: 'New API features', date: '2 weeks ago' },
]

const dummyPullRequests = [
  { id: '1', title: 'feat: Add SIMD-0128 support', subtitle: '#1284 by @dev1', status: 'Open', date: '3 hours ago' },
  { id: '2', title: 'fix: Resolve transaction parsing issue', subtitle: '#1283 by @dev2', status: 'Merged', date: '1 day ago' },
  { id: '3', title: 'docs: Update README with examples', subtitle: '#1282 by @dev3', status: 'Open', date: '2 days ago' },
  { id: '4', title: 'refactor: Optimize validator performance', subtitle: '#1281 by @dev4', status: 'Closed', date: '3 days ago' },
]

const dummyDiscussions = [
  { id: '1', title: 'Proposal: New consensus mechanism', subtitle: 'Started by @researcher1', status: 'Active', date: '5 hours ago' },
  { id: '2', title: 'Q&A: How to run a validator node?', subtitle: 'Started by @newbie', status: 'Answered', date: '1 day ago' },
  { id: '3', title: 'RFC: Deprecate legacy RPC methods', subtitle: 'Started by @maintainer', status: 'Active', date: '3 days ago' },
]

function RepositoryPage() {
  const { repoId } = Route.useParams()
  const { data: repository, isLoading } = useRepository(repoId)

  if (isLoading) {
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

        {/* Horizontal Sections */}
        <HorizontalSection
          title="Releases"
          icon="releases"
          items={dummyReleases}
        />
        <HorizontalSection
          title="Pull Requests"
          icon="pullRequests"
          items={dummyPullRequests}
        />
        <HorizontalSection
          title="Discussions"
          icon="discussions"
          items={dummyDiscussions}
        />
      </div>
    </DashboardLayout>
  )
}
