import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { createFileRoute } from '@tanstack/react-router'
import { router } from '../../../server/orpc'
import { createRequestId, logServerError } from '../../../server/errors'

const handler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      logServerError(error, { route: 'rpc' })
    }),
  ],
})

export const Route = createFileRoute('/api/rpc/$')({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        const requestId = createRequestId()
        const { response } = await handler.handle(request, {
          prefix: '/api/rpc',
          context: { request, requestId },
        })

        return response ?? new Response('Not Found', { status: 404 })
      },
    },
  },
})
