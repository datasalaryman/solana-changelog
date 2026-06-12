import { os } from '@orpc/server'
import * as z from 'zod'
import { fetchDiscussions, fetchPullRequests, fetchReleases } from './github'
import {
  getCachedDiscussions,
  getCachedPullRequests,
  getCachedReleases,
  upsertDiscussions,
  upsertPullRequests,
  upsertReleases,
} from './githubCache'
import { getGitHubToken, getUserGitHubToken } from './auth'

const base = os.$context<{ request: Request }>().errors({
  REAUTH_REQUIRED: {},
  DISCUSSIONS_DISABLED: {},
})

const repoInput = z.object({
  owner: z.string().min(1),
  repository: z.string().min(1),
})

const batchInput = repoInput.extend({
  batchPage: z.number().int().min(1).default(1),
  uiPage: z.number().int().min(1).default(1),
})

const discussionsInput = repoInput.extend({
  cursor: z.string().nullable().default(null),
  uiPage: z.number().int().min(1).default(1),
})

async function getToken(request: Request, owner: string) {
  const tokenResult = await getUserGitHubToken(request)

  if (tokenResult.needsReauth || !tokenResult.token) {
    return null
  }

  const { token } = await getGitHubToken(owner, tokenResult)
  return token ?? undefined
}

export const router = {
  github: {
    cachedReleases: base.input(batchInput).handler(async ({ input }) => {
      return getCachedReleases(input.owner, input.repository, input.batchPage, input.uiPage)
    }),
    releases: base.input(batchInput).handler(async ({ input, context, errors }) => {
      const token = await getToken(context.request, input.owner)

      if (!token) {
        throw errors.REAUTH_REQUIRED({
          message: 'GitHub authorization required. Please log in again.',
        })
      }

      const result = await fetchReleases(input.owner, input.repository, input.batchPage, input.uiPage, token)
      await upsertReleases(input.owner, input.repository, result.items)
      return result
    }),
    cachedPullRequests: base.input(batchInput).handler(async ({ input }) => {
      return getCachedPullRequests(input.owner, input.repository, input.batchPage, input.uiPage)
    }),
    pullRequests: base.input(batchInput).handler(async ({ input, context, errors }) => {
      const token = await getToken(context.request, input.owner)

      if (!token) {
        throw errors.REAUTH_REQUIRED({
          message: 'GitHub authorization required. Please log in again.',
        })
      }

      const result = await fetchPullRequests(input.owner, input.repository, input.batchPage, input.uiPage, token)
      await upsertPullRequests(input.owner, input.repository, result.items)
      return result
    }),
    cachedDiscussions: base.input(discussionsInput).handler(async ({ input }) => {
      return getCachedDiscussions(input.owner, input.repository, 1, input.uiPage)
    }),
    discussions: base.input(discussionsInput).handler(async ({ input, context, errors }) => {
      const token = await getToken(context.request, input.owner)

      if (!token) {
        throw errors.REAUTH_REQUIRED({
          message: 'GitHub authorization required. Please log in again.',
        })
      }

      try {
        const result = await fetchDiscussions(input.owner, input.repository, input.cursor, input.uiPage, token)
        await upsertDiscussions(input.owner, input.repository, result.items)
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch discussions'

        if (message.includes('not enabled') || message.includes('Discussions')) {
          throw errors.DISCUSSIONS_DISABLED({
            message: 'Discussions are not enabled for this repository.',
          })
        }

        throw error
      }
    }),
  },
}

export type AppRouter = typeof router
