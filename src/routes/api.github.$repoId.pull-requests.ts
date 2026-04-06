import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { fetchPullRequests } from '../server/github'
import { getUserGitHubToken } from '../server/auth'

export const Route = createFileRoute('/api/github/$repoId/pull-requests')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { repoId } = params
        const [owner, repo] = repoId.split('/')

        if (!owner || !repo) {
          return json({ error: 'Invalid repository format. Expected: owner/repo' }, { status: 400 })
        }

        // Get pagination params
        const url = new URL(request.url)
        const batchPage = parseInt(url.searchParams.get('batchPage') || '1', 10)
        const uiPage = parseInt(url.searchParams.get('uiPage') || '1', 10)

        // Get user's GitHub token if authenticated
        const userToken = await getUserGitHubToken(request)

        try {
          const result = await fetchPullRequests(owner, repo, batchPage, uiPage, userToken)
          return json(result)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch pull requests'
          return json({ error: message }, { status: 500 })
        }
      },
    },
  },
})
