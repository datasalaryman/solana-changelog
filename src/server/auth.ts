import { auth } from '../lib/auth'
import { db } from '../db'
import { account } from '../db/schema'
import { eq, and } from 'drizzle-orm'

const allowedGitHubScopes = new Set(['read:user', 'user:email'])

export async function getUserGitHubToken(request: Request): Promise<{ token: string; needsReauth: boolean }> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user?.id) {
      return { token: undefined as unknown as string, needsReauth: true }
    }

    const accounts = await db
      .select()
      .from(account)
      .where(and(
        eq(account.userId, session.user.id),
        eq(account.providerId, 'github')
      ))

    if (accounts.length === 0) {
      return { token: undefined as unknown as string, needsReauth: true }
    }

    const githubAccount = accounts[0]

    // Force re-auth for old GitHub grants that include broader repository scopes.
    if (githubAccount.scope?.split(/[\s,]+/).filter(Boolean).some((value) => !allowedGitHubScopes.has(value))) {
      return { token: undefined as unknown as string, needsReauth: true }
    }

    if (!githubAccount.accessToken) {
      return { token: undefined as unknown as string, needsReauth: true }
    }

    if (githubAccount.accessTokenExpiresAt) {
      const expiresAt = new Date(githubAccount.accessTokenExpiresAt)
      if (expiresAt < new Date()) {
        return { token: undefined as unknown as string, needsReauth: true }
      }
    }

    return { token: githubAccount.accessToken, needsReauth: false }
  } catch (error) {
    console.error('Error getting user GitHub token:', error)
    return { token: undefined as unknown as string, needsReauth: true }
  }
}

export async function getGitHubToken(_owner: string, tokenResult?: { token: string; needsReauth: boolean }): Promise<{ token: string | null; needsReauth: boolean }> {
  if (!tokenResult) {
    return { token: null, needsReauth: true }
  }
  return { token: tokenResult.token ?? null, needsReauth: tokenResult.needsReauth }
}
