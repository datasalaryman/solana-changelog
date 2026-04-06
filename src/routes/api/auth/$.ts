import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { auth } from '../../../lib/auth'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          
          // The request URL might be missing the host - better-auth needs a full URL
          const fullUrl = new URL(url.pathname + url.search, process.env.BETTER_AUTH_URL || 'http://localhost:3000')
          
          const fullRequest = new Request(fullUrl, {
            method: request.method,
            headers: request.headers,
          })
          
          const response = await auth.handler(fullRequest)
          
          // If it's a redirect, ensure we return it properly
          if (response.status >= 300 && response.status < 400) {
            return new Response(null, {
              status: response.status,
              headers: response.headers,
            })
          }
          
          return response
        } catch (error) {
          console.error('Auth handler error:', error)
          return json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
        }
      },
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url)
          
          // Clone the request to get the body
          const body = await request.text()
          
          // The request URL might be missing the host - better-auth needs a full URL
          const fullUrl = new URL(url.pathname + url.search, process.env.BETTER_AUTH_URL || 'http://localhost:3000')
          const fullRequest = new Request(fullUrl, {
            method: request.method,
            headers: request.headers,
            body: body || undefined,
          })
          
          const response = await auth.handler(fullRequest)
          return response
        } catch (error) {
          console.error('Auth handler error:', error)
          return json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
        }
      },
    },
  },
})
