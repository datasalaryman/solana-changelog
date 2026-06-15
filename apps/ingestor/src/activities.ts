import { fetchDiscussions, fetchPullRequests, fetchReleases } from '../../web/src/server/github'
import { upsertDiscussions, upsertPullRequests, upsertReleases } from '../../web/src/server/githubCache'
import type { DiscussionItem, PullRequestItem, ReleaseItem } from '../../web/src/types/github'
import type { RepositoryInput, SyncSummary } from './workflows'

const GITHUB_PER_PAGE = 100
const UI_PAGE_SIZE = 30
const UI_PAGES_PER_BATCH = Math.ceil(GITHUB_PER_PAGE / UI_PAGE_SIZE)

function getGitHubToken() {
  return process.env.GITHUB_TOKEN
}

async function fetchAllReleases(owner: string, repository: string, token: string | undefined) {
  const items: ReleaseItem[] = []

  for (let batchPage = 1; ; batchPage += 1) {
    let fetchedInBatch = 0

    for (let uiPage = 1; uiPage <= UI_PAGES_PER_BATCH; uiPage += 1) {
      const result = await fetchReleases(owner, repository, batchPage, uiPage, token)
      items.push(...result.items)
      fetchedInBatch += result.items.length

      if (!result.hasMore) {
        return items
      }

      if (result.items.length < UI_PAGE_SIZE) {
        break
      }
    }

    if (fetchedInBatch < GITHUB_PER_PAGE) {
      return items
    }
  }
}

async function fetchAllPullRequests(owner: string, repository: string, token: string | undefined) {
  const items: PullRequestItem[] = []

  for (let batchPage = 1; ; batchPage += 1) {
    let fetchedInBatch = 0

    for (let uiPage = 1; uiPage <= UI_PAGES_PER_BATCH; uiPage += 1) {
      const result = await fetchPullRequests(owner, repository, batchPage, uiPage, token)
      items.push(...result.items)
      fetchedInBatch += result.items.length

      if (!result.hasMore) {
        return items
      }

      if (result.items.length < UI_PAGE_SIZE) {
        break
      }
    }

    if (fetchedInBatch < GITHUB_PER_PAGE) {
      return items
    }
  }
}

async function fetchFirstDiscussionBatch(owner: string, repository: string, token: string | undefined) {
  if (!token) {
    return []
  }

  const items: DiscussionItem[] = []

  for (let uiPage = 1; uiPage <= UI_PAGES_PER_BATCH; uiPage += 1) {
    const result = await fetchDiscussions(owner, repository, null, uiPage, token)
    items.push(...result.items)

    if (!result.hasMore || result.items.length < UI_PAGE_SIZE) {
      return items
    }
  }

  return items
}

export async function syncRepository(input: RepositoryInput): Promise<Omit<SyncSummary, 'repositories'>> {
  const token = getGitHubToken()
  const { owner, repository } = input

  const [releases, pullRequests, discussions] = await Promise.all([
    fetchAllReleases(owner, repository, token),
    fetchAllPullRequests(owner, repository, token),
    fetchFirstDiscussionBatch(owner, repository, token),
  ])

  await upsertReleases(owner, repository, releases)
  await upsertPullRequests(owner, repository, pullRequests)
  await upsertDiscussions(owner, repository, discussions)

  return {
    releases: releases.length,
    pullRequests: pullRequests.length,
    discussions: discussions.length,
  }
}

export const activities = { syncRepository }
