import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { fetchDiscussions } from '../server/github'

export const Route = createFileRoute('/api/github/$repoId/discussions')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { repoId } = params
        const [owner, repo] = repoId.split('/')
        
        if (!owner || !repo) {
          return json({ error: 'Invalid repository format. Expected: owner/repo' }, { status: 400 })
        }
        
        try {
          const discussions = await fetchDiscussions(owner, repo)
          return json(discussions)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch discussions'
          return json({ error: message }, { status: 500 })
        }
      },
    },
  },
})
