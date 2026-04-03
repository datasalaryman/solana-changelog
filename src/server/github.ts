import type { 
  GitHubRelease, 
  GitHubPullRequest, 
  GitHubDiscussion,
  ReleaseItem,
  PullRequestItem,
  DiscussionItem
} from '../types/github'

const BASE_URL = process.env.GITHUB_BASE_URL || 'https://api.github.com'
const TARGET_COUNT = 10
const PER_PAGE = 100

function buildGitHubHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

function formatRelativeDate(dateString: string): string {
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

export async function fetchReleases(
  owner: string,
  repository: string
): Promise<ReleaseItem[]> {
  const headers = buildGitHubHeaders()
  const releases: GitHubRelease[] = []
  let page = 1

  while (releases.length < TARGET_COUNT) {
    const response = await fetch(
      `${BASE_URL}/repos/${owner}/${repository}/releases?per_page=${PER_PAGE}&page=${page}`,
      { headers }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return []
      }
      throw new Error(`GitHub API error ${response.status}`)
    }

    const pageItems: GitHubRelease[] = await response.json()
    if (pageItems.length === 0) {
      break
    }

    releases.push(...pageItems)
    page += 1

    if (pageItems.length < PER_PAGE) {
      break
    }
  }

  return releases.slice(0, TARGET_COUNT).map((release) => ({
    id: release.id.toString(),
    title: release.tag_name,
    subtitle: release.name || release.body?.slice(0, 100) || 'No description',
    date: formatRelativeDate(release.published_at || release.created_at),
    url: release.html_url,
  }))
}

export async function fetchPullRequests(
  owner: string,
  repository: string
): Promise<PullRequestItem[]> {
  const headers = buildGitHubHeaders()
  const prs: GitHubPullRequest[] = []
  let page = 1

  while (prs.length < TARGET_COUNT) {
    const response = await fetch(
      `${BASE_URL}/repos/${owner}/${repository}/pulls?state=all&sort=updated&direction=desc&per_page=${PER_PAGE}&page=${page}`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error ${response.status}`)
    }

    const pageItems: GitHubPullRequest[] = await response.json()
    if (pageItems.length === 0) {
      break
    }

    prs.push(...pageItems)
    page += 1

    if (pageItems.length < PER_PAGE) {
      break
    }
  }

  return prs.slice(0, TARGET_COUNT).map((pr) => {
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
      url: pr.html_url,
    }
  })
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
          comments {
            totalCount
          }
        }
      }
    }
  }
`

export async function fetchDiscussions(
  owner: string,
  repository: string
): Promise<DiscussionItem[]> {
  const headers = buildGitHubHeaders()
  
  if (!headers.Authorization) {
    throw new Error('GITHUB_TOKEN environment variable is required to fetch discussions')
  }
  
  const discussions: GitHubDiscussion[] = []
  let cursor: string | null = null

  while (discussions.length < TARGET_COUNT) {
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
    const pageInfo: { hasNextPage: boolean; endCursor: string } | undefined = result.data?.repository?.discussions?.pageInfo

    if (pageItems.length === 0) {
      break
    }

    discussions.push(...pageItems)

    if (!pageInfo?.hasNextPage) {
      break
    }
    cursor = pageInfo.endCursor
  }

  return discussions.slice(0, TARGET_COUNT).map((discussion) => ({
    id: discussion.id,
    title: discussion.title,
    subtitle: `Started by @${discussion.author?.login ?? 'unknown'}`,
    status: discussion.answerChosenAt ? 'Answered' : 'Active',
    date: formatRelativeDate(discussion.updatedAt),
    url: discussion.url,
  }))
}
