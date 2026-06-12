import { z } from "zod"

const AUTH_SECRET_PLACEHOLDER = "your-secret-key-minimum-32-characters-long"
const GITHUB_CLIENT_ID_PLACEHOLDER = "your_github_client_id"
const GITHUB_CLIENT_SECRET_PLACEHOLDER = "your_github_client_secret"
const DEFAULT_GITHUB_BASE_URL = "https://api.github.com"
const LOCAL_AUTH_URL = "http://localhost:3000"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  VERCEL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_BASE_URL: z.string().optional(),
})

type RawEnv = z.input<typeof envSchema>

function isLoopbackHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase()

  return normalized === "localhost"
    || normalized === "127.0.0.1"
    || normalized.startsWith("127.")
    || normalized === "0.0.0.0"
    || normalized === "::1"
    || normalized === "[::1]"
}

function parseUrl(value: string): URL | undefined {
  try {
    return new URL(value)
  } catch {
    return undefined
  }
}

function validateDatabaseUrl(value: string | undefined, isProductionLike: boolean, ctx: z.RefinementCtx): void {
  if (!value) {
    ctx.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "is required" })
    return
  }

  const url = parseUrl(value)

  if (!url) {
    ctx.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "must be a valid URL" })
    return
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    ctx.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "must use postgres:// or postgresql://" })
  }

  if (!url.hostname) {
    ctx.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "must include a host" })
  }

  if (!url.username) {
    ctx.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "must include a username" })
  }

  if (!url.password) {
    ctx.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "must include a password" })
  }

  if (!url.pathname || url.pathname === "/") {
    ctx.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "must include a database name" })
  }

  const sslMode = url.searchParams.get("sslmode")
  const ssl = url.searchParams.get("ssl")
  const hasSslIntent = ssl === "true" || sslMode === "require" || sslMode === "verify-ca" || sslMode === "verify-full"

  if (isProductionLike && !hasSslIntent) {
    ctx.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "must include sslmode=require or equivalent SSL intent in production" })
  }
}

function validateAuthUrl(value: string | undefined, isProductionLike: boolean, ctx: z.RefinementCtx): void {
  if (!value) {
    if (isProductionLike) {
      ctx.addIssue({ code: "custom", path: ["BETTER_AUTH_URL"], message: "is required in production" })
    }
    return
  }

  const url = parseUrl(value)

  if (!url) {
    ctx.addIssue({ code: "custom", path: ["BETTER_AUTH_URL"], message: "must be a valid absolute URL" })
    return
  }

  if (isProductionLike && url.protocol !== "https:") {
    ctx.addIssue({ code: "custom", path: ["BETTER_AUTH_URL"], message: "must use HTTPS in production" })
  }

  if (isProductionLike && isLoopbackHost(url.hostname)) {
    ctx.addIssue({ code: "custom", path: ["BETTER_AUTH_URL"], message: "must not use localhost or loopback hosts in production" })
  }
}

function validateGitHubBaseUrl(value: string | undefined, isProductionLike: boolean, ctx: z.RefinementCtx): void {
  if (!value) {
    return
  }

  const url = parseUrl(value)

  if (!url) {
    ctx.addIssue({ code: "custom", path: ["GITHUB_BASE_URL"], message: "must be a valid absolute URL" })
    return
  }

  if (isProductionLike && url.protocol !== "https:") {
    ctx.addIssue({ code: "custom", path: ["GITHUB_BASE_URL"], message: "must use HTTPS in production" })
  }
}

function formatEnvError(error: z.ZodError): Error {
  const details = error.issues.map((issue) => {
    const name = issue.path[0]?.toString() || "environment"
    return `${name}: ${issue.message}`
  })

  return new Error(`Invalid environment configuration:\n${details.join("\n")}`)
}

export function parseEnv(rawEnv: RawEnv): {
  NODE_ENV?: "development" | "test" | "production"
  VERCEL?: string
  DATABASE_URL: string
  BETTER_AUTH_SECRET?: string
  BETTER_AUTH_URL: string
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  GITHUB_BASE_URL: string
  IS_PRODUCTION_LIKE: boolean
} {
  const parsed = envSchema.superRefine((value, ctx) => {
    const isProductionLike = value.NODE_ENV === "production" || value.VERCEL === "1"

    validateDatabaseUrl(value.DATABASE_URL, isProductionLike, ctx)
    validateAuthUrl(value.BETTER_AUTH_URL, isProductionLike, ctx)
    validateGitHubBaseUrl(value.GITHUB_BASE_URL, isProductionLike, ctx)

    if (isProductionLike) {
      if (!value.BETTER_AUTH_SECRET) {
        ctx.addIssue({ code: "custom", path: ["BETTER_AUTH_SECRET"], message: "is required in production" })
      } else if (value.BETTER_AUTH_SECRET.length < 32) {
        ctx.addIssue({ code: "custom", path: ["BETTER_AUTH_SECRET"], message: "must be at least 32 characters" })
      } else if (value.BETTER_AUTH_SECRET === AUTH_SECRET_PLACEHOLDER) {
        ctx.addIssue({ code: "custom", path: ["BETTER_AUTH_SECRET"], message: "must not use the example placeholder" })
      }

      if (!value.GITHUB_CLIENT_ID) {
        ctx.addIssue({ code: "custom", path: ["GITHUB_CLIENT_ID"], message: "is required in production" })
      } else if (value.GITHUB_CLIENT_ID === GITHUB_CLIENT_ID_PLACEHOLDER) {
        ctx.addIssue({ code: "custom", path: ["GITHUB_CLIENT_ID"], message: "must not use the example placeholder" })
      }

      if (!value.GITHUB_CLIENT_SECRET) {
        ctx.addIssue({ code: "custom", path: ["GITHUB_CLIENT_SECRET"], message: "is required in production" })
      } else if (value.GITHUB_CLIENT_SECRET === GITHUB_CLIENT_SECRET_PLACEHOLDER) {
        ctx.addIssue({ code: "custom", path: ["GITHUB_CLIENT_SECRET"], message: "must not use the example placeholder" })
      }
    }
  }).safeParse(rawEnv)

  if (!parsed.success) {
    throw formatEnvError(parsed.error)
  }

  const isProductionLike = parsed.data.NODE_ENV === "production" || parsed.data.VERCEL === "1"

  return {
    NODE_ENV: parsed.data.NODE_ENV,
    VERCEL: parsed.data.VERCEL,
    DATABASE_URL: parsed.data.DATABASE_URL as string,
    BETTER_AUTH_SECRET: parsed.data.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: parsed.data.BETTER_AUTH_URL || LOCAL_AUTH_URL,
    GITHUB_CLIENT_ID: parsed.data.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: parsed.data.GITHUB_CLIENT_SECRET,
    GITHUB_BASE_URL: parsed.data.GITHUB_BASE_URL || DEFAULT_GITHUB_BASE_URL,
    IS_PRODUCTION_LIKE: isProductionLike,
  }
}

export function getEnv() {
  return parseEnv(process.env)
}
