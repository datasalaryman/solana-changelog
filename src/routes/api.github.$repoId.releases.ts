import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { fetchReleases } from '../server/github'

export const Route = createFileRoute('/api/github/$repoId/releases')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { repoId } = params
        const [owner, repo] = repoId.split('/')
        
        if (!owner || !repo) {
          return json({ error: 'Invalid repository format. Expected: owner/repo' }, { status: 400 })
        }
        
        try {
          const releases = await fetchReleases(owner, repo)
          return json(releases)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch releases'
          return json({ error: message }, { status: 500 })
        }
      },
    },
  },
})
