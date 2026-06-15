import { proxyActivities } from '@temporalio/workflow'
import type { activities } from './activities'
import repositories from '../../web/src/data/repositories.json'

const { syncRepository } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: {
    initialInterval: '30 seconds',
    maximumInterval: '5 minutes',
    maximumAttempts: 3,
  },
})

export interface RepositoryInput {
  owner: string
  repository: string
}

export interface SyncSummary {
  repositories: number
  releases: number
  pullRequests: number
  discussions: number
}

export async function syncRepositoriesWorkflow(): Promise<SyncSummary> {
  const summary: SyncSummary = {
    repositories: 0,
    releases: 0,
    pullRequests: 0,
    discussions: 0,
  }

  for (const repository of repositories as RepositoryInput[]) {
    const result = await syncRepository(repository)
    summary.repositories += 1
    summary.releases += result.releases
    summary.pullRequests += result.pullRequests
    summary.discussions += result.discussions
  }

  return summary
}
