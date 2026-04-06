import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../db"

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "mysql",
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      // Request additional scopes for accessing private repos and user email
      scopes: ["read:user", "user:email", "repo", "read:org"],
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: false, // Set to true in production with HTTPS
    },
  },
})
