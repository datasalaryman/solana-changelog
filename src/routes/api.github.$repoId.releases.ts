import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { fetchReleases } from '../server/github'
import { getUserGitHubToken, getGitHubToken } from '../server/auth'

export const Route = createFileRoute('/api/github/$repoId/releases')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { repoId } = params
        const [owner, repo] = repoId.split('/')

        if (!owner || !repo) {
          return json({ error: 'Invalid repository format. Expected: owner/repo' }, { status: 400 })
        }

        const url = new URL(request.url)
        const batchPage = parseInt(url.searchParams.get('batchPage') || '1', 10)
        const uiPage = parseInt(url.searchParams.get('uiPage') || '1', 10)

        const tokenResult = await getUserGitHubToken(request)

        if (tokenResult.needsReauth || !tokenResult.token) {
          return json({ 
            error: 'GitHub authorization required. Please log in again.',
            code: 'REAUTH_REQUIRED'
          }, { status: 401 })
        }

        const { token } = await getGitHubToken(owner, tokenResult)

        try {
          const result = await fetchReleases(owner, repo, batchPage, uiPage, token ?? undefined)
          return json(result)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch releases'
          return json({ error: message }, { status: 500 })
        }
      },
    },
  },
})