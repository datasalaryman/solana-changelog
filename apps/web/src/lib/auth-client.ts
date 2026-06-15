import { createAuthClient } from "better-auth/client"

const baseURL = typeof window !== "undefined"
  ? window.location.origin
  : undefined

export const authClient = createAuthClient({
  baseURL,
})

export type AuthClient = typeof authClient
