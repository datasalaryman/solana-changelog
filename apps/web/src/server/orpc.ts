import { os } from '@orpc/server'
import { fetchDiscussions, fetchPullRequests, fetchReleases } from './github'
import { GitHubServiceError, getPublicErrorMessage, logServerError } from './errors'
import {
  getCachedDiscussions,
  getCachedPullRequests,
  getCachedReleases,
  upsertDiscussions,
  upsertPullRequests,
  upsertReleases,
} from './githubCache'
import { getGitHubToken, getUserGitHubToken } from './auth'
import { batchInput, discussionsInput } from './repositoryInput'

const base = os.$context<{ request: Request; requestId?: string }>().errors({
  REAUTH_REQUIRED: {},
  DISCUSSIONS_DISABLED: {},
  NOT_FOUND: {},
  UPSTREAM_UNAVAILABLE: {},
  INTERNAL_SERVER_ERROR: {},
})

async function getToken(request: Request, owner: string) {
  const tokenResult = await getUserGitHubToken(request)

  if (tokenResult.needsReauth || !tokenResult.token) {
    return null
  }

  const { token } = await getGitHubToken(owner, tokenResult)
  return token ?? undefined
}

type ErrorConstructors = {
  REAUTH_REQUIRED: (options?: { message?: string }) => Error
  DISCUSSIONS_DISABLED: (options?: { message?: string }) => Error
  NOT_FOUND: (options?: { message?: string }) => Error
  UPSTREAM_UNAVAILABLE: (options?: { message?: string }) => Error
  INTERNAL_SERVER_ERROR: (options?: { message?: string }) => Error
}

function throwPublicProcedureError(
  error: unknown,
  errors: ErrorConstructors,
  context: { requestId?: string; procedure: string; owner: string; repository: string }
): never {
  const publicCode = error instanceof GitHubServiceError
    ? error.code
    : typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: string }).code
      : undefined

  if (publicCode === 'REAUTH_REQUIRED') {
    throw errors.REAUTH_REQUIRED({ message: getPublicErrorMessage('REAUTH_REQUIRED') })
  }
  if (publicCode === 'DISCUSSIONS_DISABLED') {
    throw errors.DISCUSSIONS_DISABLED({ message: getPublicErrorMessage('DISCUSSIONS_DISABLED') })
  }
  if (publicCode === 'NOT_FOUND') {
    throw errors.NOT_FOUND({ message: getPublicErrorMessage('NOT_FOUND') })
  }

  logServerError(error, {
    requestId: context.requestId,
    route: 'rpc',
    procedure: context.procedure,
    owner: context.owner,
    repository: context.repository,
    status: error instanceof GitHubServiceError ? error.status : undefined,
    code: error instanceof GitHubServiceError ? error.code : undefined,
    metadata: error instanceof GitHubServiceError ? error.metadata : undefined,
  })

  throw errors.UPSTREAM_UNAVAILABLE({ message: getPublicErrorMessage('UPSTREAM_UNAVAILABLE') })
}

export const router = {
  github: {
    cachedReleases: base.input(batchInput).handler(async ({ input, context, errors }) => {
      try {
        return await getCachedReleases(input.owner, input.repository, input.batchPage, input.uiPage)
      } catch (error) {
        throwPublicProcedureError(error, errors, { ...input, requestId: context.requestId, procedure: 'cachedReleases' })
      }
    }),
    releases: base.input(batchInput).handler(async ({ input, context, errors }) => {
      try {
        const token = await getToken(context.request, input.owner)

        if (!token) {
          throw errors.REAUTH_REQUIRED({
            message: getPublicErrorMessage('REAUTH_REQUIRED'),
          })
        }

        const result = await fetchReleases(input.owner, input.repository, input.batchPage, input.uiPage, token)
        await upsertReleases(input.owner, input.repository, result.items)
        return result
      } catch (error) {
        throwPublicProcedureError(error, errors, { ...input, requestId: context.requestId, procedure: 'releases' })
      }
    }),
    cachedPullRequests: base.input(batchInput).handler(async ({ input, context, errors }) => {
      try {
        return await getCachedPullRequests(input.owner, input.repository, input.batchPage, input.uiPage)
      } catch (error) {
        throwPublicProcedureError(error, errors, { ...input, requestId: context.requestId, procedure: 'cachedPullRequests' })
      }
    }),
    pullRequests: base.input(batchInput).handler(async ({ input, context, errors }) => {
      try {
        const token = await getToken(context.request, input.owner)

        if (!token) {
          throw errors.REAUTH_REQUIRED({
            message: getPublicErrorMessage('REAUTH_REQUIRED'),
          })
        }

        const result = await fetchPullRequests(input.owner, input.repository, input.batchPage, input.uiPage, token)
        await upsertPullRequests(input.owner, input.repository, result.items)
        return result
      } catch (error) {
        throwPublicProcedureError(error, errors, { ...input, requestId: context.requestId, procedure: 'pullRequests' })
      }
    }),
    cachedDiscussions: base.input(discussionsInput).handler(async ({ input, context, errors }) => {
      try {
        return await getCachedDiscussions(input.owner, input.repository, 1, input.uiPage)
      } catch (error) {
        throwPublicProcedureError(error, errors, { ...input, requestId: context.requestId, procedure: 'cachedDiscussions' })
      }
    }),
    discussions: base.input(discussionsInput).handler(async ({ input, context, errors }) => {
      try {
        const token = await getToken(context.request, input.owner)

        if (!token) {
          throw errors.REAUTH_REQUIRED({
            message: getPublicErrorMessage('REAUTH_REQUIRED'),
          })
        }

        const result = await fetchDiscussions(input.owner, input.repository, input.cursor, input.uiPage, token)
        await upsertDiscussions(input.owner, input.repository, result.items)
        return result
      } catch (error) {
        throwPublicProcedureError(error, errors, { ...input, requestId: context.requestId, procedure: 'discussions' })
      }
    }),
  },
}

export type AppRouter = typeof router
