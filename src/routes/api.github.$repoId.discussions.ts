import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { fetchDiscussions } from '../server/github'
import { getUserGitHubToken, getGitHubToken } from '../server/auth'

export const Route = createFileRoute('/api/github/$repoId/discussions')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { repoId } = params
        const [owner, repo] = repoId.split('/')

        if (!owner || !repo) {
          return json({ error: 'Invalid repository format. Expected: owner/repo' }, { status: 400 })
        }

        const url = new URL(request.url)
        const cursor = url.searchParams.get('cursor')
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
          const result = await fetchDiscussions(owner, repo, cursor, uiPage, token ?? undefined)
          return json(result)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch discussions'
          
          if (message.includes('not enabled') || message.includes('Discussions')) {
            return json({ 
              error: 'Discussions are not enabled for this repository.',
              disabled: true 
            }, { status: 404 })
          }
          
          return json({ error: message }, { status: 500 })
        }
      },
    },
  },
})