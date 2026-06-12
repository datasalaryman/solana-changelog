import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required")
}

const parsedConnectionString = new URL(connectionString)

const pool = new Pool({
  host: parsedConnectionString.hostname,
  port: parsedConnectionString.port ? Number(parsedConnectionString.port) : 5432,
  user: decodeURIComponent(parsedConnectionString.username),
  password: decodeURIComponent(parsedConnectionString.password),
  database: parsedConnectionString.pathname.replace(/^\//, ""),
  ssl: {
    rejectUnauthorized: true,
  },
})

export const db = drizzle(pool, { schema })
