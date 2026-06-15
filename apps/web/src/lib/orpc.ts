import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import type { AppRouter } from '../server/orpc'

function getServerUrl(headers: Headers) {
  const host = headers.get('x-forwarded-host') ?? headers.get('host') ?? 'localhost:3000'
  const protocol = headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')

  return `${protocol}://${host}/api/rpc`
}

const getORPCClient = createIsomorphicFn()
  .client((): RouterClient<AppRouter> => {
    const link = new RPCLink({
      url: `${window.location.origin}/api/rpc`,
    })

    return createORPCClient(link)
  })
  .server((): RouterClient<AppRouter> => {
    const headers = getRequestHeaders()
    const link = new RPCLink({
      url: getServerUrl(headers),
      headers: () => headers,
    })

    return createORPCClient(link)
  })

export const orpc = getORPCClient()
