import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { fetchDiscussions } from '../server/github'

export const Route = createFileRoute('/api/github/$repoId/discussions')({
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
        const cursor = url.searchParams.get('cursor')
        const uiPage = parseInt(url.searchParams.get('uiPage') || '1', 10)
        
        try {
          const result = await fetchDiscussions(owner, repo, cursor, uiPage)
          return json(result)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch discussions'
          return json({ error: message }, { status: 500 })
        }
      },
    },
  },
})
