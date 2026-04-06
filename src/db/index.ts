import { Client } from '@planetscale/database'
import { drizzle } from 'drizzle-orm/planetscale-serverless'
import * as schema from "./schema"

const host = process.env.DATABASE_HOST
const username = process.env.DATABASE_USERNAME
const password = process.env.DATABASE_PASSWORD

if (!host || !username || !password) {
  throw new Error(
    "DATABASE_HOST, DATABASE_USERNAME, and DATABASE_PASSWORD environment variables are required"
  )
}

const client = new Client({
  host,
  username,
  password,
})

export const db = drizzle(client, { schema })
