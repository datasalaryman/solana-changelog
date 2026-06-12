import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../db"

const isSecure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || (isSecure ? undefined : "http://localhost:3000"),
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
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
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      scopes: ["read:user", "user:email", "repo"],
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: isSecure,
    },
    useSecureCookies: isSecure,
    generateId: false,
  },
})
