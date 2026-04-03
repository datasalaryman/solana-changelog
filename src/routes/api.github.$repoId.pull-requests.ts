import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { fetchPullRequests } from '../server/github'

export const Route = createFileRoute('/api/github/$repoId/pull-requests')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { repoId } = params
        const [owner, repo] = repoId.split('/')
        
        if (!owner || !repo) {
          return json({ error: 'Invalid repository format. Expected: owner/repo' }, { status: 400 })
        }
        
        // Get page from query params
        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1', 10)
        
        try {
          const result = await fetchPullRequests(owner, repo, page)
          return json(result)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch pull requests'
          return json({ error: message }, { status: 500 })
        }
      },
    },
  },
})
