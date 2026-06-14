import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getEnv } from '../../../env'
import { getAuth } from '../../../lib/auth'
import { createRequestId, getErrorDetails, getPublicErrorMessage, logServerError } from '../../../server/errors'
import { rateLimitRequest } from '../../../server/rateLimit'

function internalErrorResponse(error: unknown, request: Request) {
  const requestId = createRequestId()
  logServerError(error, {
    requestId,
    route: 'auth',
    method: request.method,
  })

  return json({
    error: getPublicErrorMessage('INTERNAL_SERVER_ERROR'),
    requestId,
    ...(process.env.NODE_ENV !== 'production' ? { details: getErrorDetails(error) } : {}),
  }, { status: 500 })
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const rateLimitResponse = await rateLimitRequest(request, 'auth:get')
          if (rateLimitResponse) {
            return rateLimitResponse
          }

          const env = getEnv()
          const url = new URL(request.url)
          const fullUrl = new URL(url.pathname + url.search, env.BETTER_AUTH_URL)
          
          const fullRequest = new Request(fullUrl, {
            method: request.method,
            headers: request.headers,
          })
          
          const response = await getAuth().handler(fullRequest)
          
          if (response.status >= 300 && response.status < 400) {
            return new Response(null, {
              status: response.status,
              headers: response.headers,
            })
          }
          
          return response
        } catch (error) {
          return internalErrorResponse(error, request)
        }
      },
      POST: async ({ request }) => {
        try {
          const rateLimitResponse = await rateLimitRequest(request, 'auth:post')
          if (rateLimitResponse) {
            return rateLimitResponse
          }

          const env = getEnv()
          const url = new URL(request.url)
          const body = await request.text()
          
          const fullUrl = new URL(url.pathname + url.search, env.BETTER_AUTH_URL)
          const fullRequest = new Request(fullUrl, {
            method: request.method,
            headers: request.headers,
            body: body || undefined,
          })
          
          const response = await getAuth().handler(fullRequest)
          return response
        } catch (error) {
          return internalErrorResponse(error, request)
        }
      },
    },
  },
})
