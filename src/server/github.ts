import type {
  GitHubRelease,
  GitHubPullRequest,
  GitHubDiscussion,
  ReleaseItem,
  PullRequestItem,
  DiscussionItem
} from '../types/github'

const BASE_URL = process.env.GITHUB_BASE_URL || 'https://api.github.com'
const GITHUB_PER_PAGE = 100 // Fetch 100 from GitHub to minimize API calls
const UI_PAGE_SIZE = 30 // Show 30 items at a time in UI

function buildGitHubHeaders(userToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  if (userToken) {
    headers.Authorization = `Bearer ${userToken}`
  }

  return headers
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  return date.toLocaleDateString()
}

export interface PaginatedBatchResult<T> {
  items: T[]
  batchPage: number // Which GitHub API page this is
  uiPage: number // Which UI page (30 items) within the batch
  totalFetched: number // Total items fetched so far across all batches
  hasMore: boolean
}

export async function fetchReleases(
  owner: string,
  repository: string,
  batchPage: number = 1,
  uiPage: number = 1,
  userToken?: string
): Promise<PaginatedBatchResult<ReleaseItem>> {
  const headers = buildGitHubHeaders(userToken)
  
  const response = await fetch(
    `${BASE_URL}/repos/${owner}/${repository}/releases?per_page=${GITHUB_PER_PAGE}&page=${batchPage}`,
    { headers }
  )

  if (!response.ok) {
    if (response.status === 404) {
      return { items: [], batchPage: 1, uiPage: 1, totalFetched: 0, hasMore: false }
    }
    const rateLimit = response.headers.get('x-ratelimit-remaining')
    const rateLimitReset = response.headers.get('x-ratelimit-reset')
    console.error(`GitHub API error ${response.status} for ${owner}/${repository} releases. Rate limit remaining: ${rateLimit}, Resets at: ${rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toISOString() : 'unknown'}`)
    throw new Error(`GitHub API error ${response.status}`)
  }

  const pageItems: GitHubRelease[] = await response.json()
  
  const allItems = pageItems.map((release) => ({
    id: release.id.toString(),
    title: release.tag_name,
    subtitle: release.name || release.body?.slice(0, 100) || 'No description',
    date: formatRelativeDate(release.published_at || release.created_at),
    originalDate: release.published_at || release.created_at,
    url: release.html_url,
  }))

  // Slice to get only the 30 items for the current UI page
  const startIndex = (uiPage - 1) * UI_PAGE_SIZE
  const endIndex = startIndex + UI_PAGE_SIZE
  const items = allItems.slice(startIndex, endIndex)

  // Determine if there's more data
  const hasMoreInBatch = endIndex < allItems.length
  const hasMoreBatches = pageItems.length === GITHUB_PER_PAGE
  const hasMore = hasMoreInBatch || hasMoreBatches

  return { 
    items, 
    batchPage,
    uiPage,
    totalFetched: ((batchPage - 1) * GITHUB_PER_PAGE) + allItems.length,
    hasMore
  }
}

export async function fetchPullRequests(
  owner: string,
  repository: string,
  batchPage: number = 1,
  uiPage: number = 1,
  userToken?: string
): Promise<PaginatedBatchResult<PullRequestItem>> {
  const headers = buildGitHubHeaders(userToken)
  
  const response = await fetch(
    `${BASE_URL}/repos/${owner}/${repository}/pulls?state=all&sort=updated&direction=desc&per_page=${GITHUB_PER_PAGE}&page=${batchPage}`,
    { headers }
  )

  if (!response.ok) {
    const rateLimit = response.headers.get('x-ratelimit-remaining')
    const rateLimitReset = response.headers.get('x-ratelimit-reset')
    console.error(`GitHub API error ${response.status} for ${owner}/${repository} pull requests. Rate limit remaining: ${rateLimit}, Resets at: ${rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toISOString() : 'unknown'}`)
    throw new Error(`GitHub API error ${response.status}`)
  }

  const pageItems: GitHubPullRequest[] = await response.json()

  const allItems = pageItems.map((pr) => {
    let status: 'Open' | 'Merged' | 'Closed'
    if (pr.merged_at) {
      status = 'Merged'
    } else if (pr.state === 'open') {
      status = 'Open'
    } else {
      status = 'Closed'
    }

    return {
      id: pr.id.toString(),
      title: pr.title,
      subtitle: `#${pr.number} by @${pr.user.login}`,
      status,
      date: formatRelativeDate(pr.updated_at),
      originalDate: pr.updated_at,
      url: pr.html_url,
    }
  })

  // Slice to get only the 30 items for the current UI page
  const startIndex = (uiPage - 1) * UI_PAGE_SIZE
  const endIndex = startIndex + UI_PAGE_SIZE
  const items = allItems.slice(startIndex, endIndex)

  // Determine if there's more data
  const hasMoreInBatch = endIndex < allItems.length
  const hasMoreBatches = pageItems.length === GITHUB_PER_PAGE
  const hasMore = hasMoreInBatch || hasMoreBatches

  return { 
    items, 
    batchPage,
    uiPage,
    totalFetched: ((batchPage - 1) * GITHUB_PER_PAGE) + allItems.length,
    hasMore
  }
}

const DISCUSSIONS_QUERY = `
  query($owner: String!, $repo: String!, $cursor: String) {
    repository(owner: $owner, name: $repo) {
      discussions(first: 100, after: $cursor, orderBy: {field: UPDATED_AT, direction: DESC}) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          number
          title
          url
          createdAt
          updatedAt
          author {
            login
          }
          category {
            name
          }
          answerChosenAt
        }
      }
    }
  }
`

export async function fetchDiscussions(
  owner: string,
  repository: string,
  cursor: string | null = null,
  uiPage: number = 1,
  userToken?: string
): Promise<PaginatedBatchResult<DiscussionItem>> {
  const headers = buildGitHubHeaders(userToken)
  
  if (!headers.Authorization) {
    throw new Error('GitHub authentication required to fetch discussions')
  }
  
  const response = await fetch(`${BASE_URL}/graphql`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: DISCUSSIONS_QUERY,
      variables: { owner, repo: repository, cursor },
    }),
  })

  if (!response.ok) {
    throw new Error(`GitHub API error ${response.status}`)
  }

  const result: {
    errors?: Array<{ message: string }>
    data?: {
      repository?: {
        discussions?: {
          nodes?: GitHubDiscussion[]
          pageInfo?: {
            hasNextPage: boolean
            endCursor: string
          }
        }
      }
    }
  } = await response.json()

  if (result.errors) {
    const errorMessages = result.errors.map((e) => e.message).join(', ')
    if (errorMessages.includes('Discussions') || errorMessages.includes('discussions')) {
      throw new Error('Discussions are not enabled for this repository')
    }
    throw new Error(`GraphQL error: ${errorMessages}`)
  }

  if (!result.data?.repository) {
    throw new Error('Repository not found')
  }

  const pageItems: GitHubDiscussion[] = result.data?.repository?.discussions?.nodes ?? []
  const pageInfo = result.data?.repository?.discussions?.pageInfo

  const allItems: DiscussionItem[] = pageItems.map((discussion) => ({
    id: discussion.id,
    title: discussion.title,
    subtitle: `Started by @${discussion.author?.login ?? 'unknown'}`,
    status: discussion.answerChosenAt ? 'Answered' : 'Active',
    date: formatRelativeDate(discussion.updatedAt),
    originalDate: discussion.updatedAt,
    url: discussion.url,
  }))

  // Slice to get only the 30 items for the current UI page
  const startIndex = (uiPage - 1) * UI_PAGE_SIZE
  const endIndex = startIndex + UI_PAGE_SIZE
  const items = allItems.slice(startIndex, endIndex)

  // Determine if there's more data
  const hasMoreInBatch = endIndex < allItems.length
  const hasMoreBatches = pageInfo?.hasNextPage ?? false
  const hasMore = hasMoreInBatch || hasMoreBatches

  return { 
    items, 
    batchPage: 1, // Not used for cursor-based pagination
    uiPage,
    totalFetched: allItems.length,
    hasMore
  }
}
