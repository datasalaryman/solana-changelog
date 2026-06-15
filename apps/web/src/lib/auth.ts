import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { getDb } from "../db"
import { getEnv } from "../env"

function createAuth() {
  const env = getEnv()

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    database: drizzleAdapter(getDb(), {
      provider: "pg",
    }),
    session: {
      expiresIn: 60 * 5,
      updateAge: 60 * 4,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["github"],
      },
    },
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID || "",
        clientSecret: env.GITHUB_CLIENT_SECRET || "",
        scopes: ["read:user", "user:email"],
      },
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: env.IS_PRODUCTION_LIKE,
      },
      useSecureCookies: env.IS_PRODUCTION_LIKE,
      generateId: false,
    },
  })
}

type Auth = ReturnType<typeof createAuth>

let auth: Auth | undefined

export function getAuth(): Auth {
  auth ??= createAuth()

  return auth
}
