import { createAuthClient } from "better-auth/client"

// Use the same base URL as the server, or fallback to localhost
const baseURL = typeof window !== "undefined"
  ? `${window.location.origin}/api/auth`
  : process.env.BETTER_AUTH_URL
    ? `${process.env.BETTER_AUTH_URL}/api/auth`
    : "http://localhost:3000/api/auth"

export const authClient = createAuthClient({
  baseURL,
})

export type AuthClient = typeof authClient
