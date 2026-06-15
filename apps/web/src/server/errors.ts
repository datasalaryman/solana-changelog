export type PublicErrorCode =
  | 'REAUTH_REQUIRED'
  | 'DISCUSSIONS_DISABLED'
  | 'NOT_FOUND'
  | 'UPSTREAM_UNAVAILABLE'
  | 'INTERNAL_SERVER_ERROR'

export type ServerErrorContext = {
  requestId?: string
  route?: string
  procedure?: string
  method?: string
  owner?: string
  repository?: string
  status?: number
  code?: string
  metadata?: Record<string, string | number | boolean | null | undefined>
}

export function getPublicErrorMessage(code: PublicErrorCode): string {
  switch (code) {
    case 'REAUTH_REQUIRED':
      return 'GitHub authorization required. Please log in again.'
    case 'DISCUSSIONS_DISABLED':
      return 'Discussions are not enabled for this repository.'
    case 'NOT_FOUND':
      return 'The requested resource was not found.'
    case 'UPSTREAM_UNAVAILABLE':
      return 'GitHub data is temporarily unavailable. Please try again.'
    case 'INTERNAL_SERVER_ERROR':
      return 'Internal server error'
  }
}

export function createRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function getErrorDetails(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function logServerError(error: unknown, context: ServerErrorContext = {}) {
  console.error('Server error', {
    ...context,
    error,
  })
}

export class GitHubServiceError extends Error {
  readonly code: PublicErrorCode
  readonly status?: number
  readonly metadata?: ServerErrorContext['metadata']

  constructor(code: PublicErrorCode, options: { message?: string; status?: number; metadata?: ServerErrorContext['metadata'] } = {}) {
    super(options.message ?? getPublicErrorMessage(code))
    this.name = 'GitHubServiceError'
    this.code = code
    this.status = options.status
    this.metadata = options.metadata
  }
}
