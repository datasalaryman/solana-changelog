import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { getEnv } from "../env"
import * as schema from "./schema"

type Database = ReturnType<typeof drizzle<typeof schema>>

let db: Database | undefined

export function getDb(): Database {
  if (db) {
    return db
  }

  const parsedConnectionString = new URL(getEnv().DATABASE_URL)
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

  db = drizzle(pool, { schema })
  return db
}
