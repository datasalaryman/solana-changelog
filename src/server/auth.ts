import { auth } from '../lib/auth'

interface Account {
  providerId: string
  accessToken?: string
}

export async function getUserGitHubToken(request: Request): Promise<string | undefined> {
  try {
    // Get the session from the request
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user?.id) {
      return undefined
    }

    // Get the user's GitHub account to access the access token
    // The account data is stored by Better Auth during OAuth
    const accounts = await auth.api.listUserAccounts({
      headers: request.headers,
    }) as Account[] | undefined

    const githubAccount = accounts?.find(
      (account) => account.providerId === 'github'
    )

    // Return the access token from the GitHub account
    return githubAccount?.accessToken
  } catch (error) {
    console.error('Error getting user GitHub token:', error)
    return undefined
  }
}
