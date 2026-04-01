import { createFileRoute, Navigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '../components/DashboardLayout'
import { useRepositories } from '../hooks/useRepositories'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data: repositories, isLoading } = useRepositories()

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--lagoon-deep)]" />
        </div>
      </DashboardLayout>
    )
  }

  // Redirect to the first repository if available
  if (repositories && repositories.length > 0) {
    return <Navigate to="/repo/$repoId" params={{ repoId: repositories[0].id }} />
  }

  return (
    <DashboardLayout>
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="island-shell rounded-2xl p-10 max-w-md">
          <h1 className="display-title mb-4 text-3xl font-bold text-[var(--sea-ink)]">
            Solana Technical Update Dashboard
          </h1>
          <p className="mb-6 text-[var(--sea-ink-soft)]">
            Welcome to the Solana Technical Update Dashboard. Select a repository from the sidebar to view its releases, pull requests, and discussions.
          </p>
          <p className="text-sm text-[var(--sea-ink-soft)]">
            No repositories available.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
