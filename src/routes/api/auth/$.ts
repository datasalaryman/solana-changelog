import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getEnv } from '../../../env'
import { getAuth } from '../../../lib/auth'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
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
          return json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
        }
      },
      POST: async ({ request }) => {
        try {
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
          return json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
        }
      },
    },
  },
})
