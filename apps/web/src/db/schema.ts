import { boolean, integer, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core"

export const user = pgTable("solana_changelog_user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
})

export const session = pgTable("solana_changelog_session", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
})

export const account = pgTable("solana_changelog_account", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
})

export const verification = pgTable("solana_changelog_verification", {
  id: varchar("id", { length: 36 }).primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
})

export const githubRelease = pgTable("solana_changelog_github_release", {
  id: varchar("id", { length: 255 }).primaryKey(),
  githubId: varchar("github_id", { length: 255 }).notNull(),
  owner: varchar("owner", { length: 255 }).notNull(),
  repository: varchar("repository", { length: 255 }).notNull(),
  tagName: text("tag_name").notNull(),
  name: text("name"),
  description: text("description"),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull(),
  publishedAt: timestamp("published_at"),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("github_release_repo_github_id_idx").on(table.owner, table.repository, table.githubId),
])

export const githubPullRequest = pgTable("solana_changelog_github_pull_request", {
  id: varchar("id", { length: 255 }).primaryKey(),
  githubId: varchar("github_id", { length: 255 }).notNull(),
  owner: varchar("owner", { length: 255 }).notNull(),
  repository: varchar("repository", { length: 255 }).notNull(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  state: varchar("state", { length: 32 }).notNull(),
  mergedAt: timestamp("merged_at"),
  authorLogin: varchar("author_login", { length: 255 }).notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  closedAt: timestamp("closed_at"),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("github_pull_request_repo_github_id_idx").on(table.owner, table.repository, table.githubId),
])

export const githubDiscussion = pgTable("solana_changelog_github_discussion", {
  id: varchar("id", { length: 255 }).primaryKey(),
  githubId: varchar("github_id", { length: 255 }).notNull(),
  owner: varchar("owner", { length: 255 }).notNull(),
  repository: varchar("repository", { length: 255 }).notNull(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  categoryName: varchar("category_name", { length: 255 }),
  authorLogin: varchar("author_login", { length: 255 }),
  answerChosenAt: timestamp("answer_chosen_at"),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("github_discussion_repo_github_id_idx").on(table.owner, table.repository, table.githubId),
])
