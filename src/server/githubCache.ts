import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { githubDiscussion, githubPullRequest, githubRelease } from '../db/schema'
import type { DiscussionItem, PullRequestItem, ReleaseItem } from '../types/github'
import type { PaginatedBatchResult } from './github'
import { formatRelativeDate } from './github'

const UI_PAGE_SIZE = 30
const GITHUB_PER_PAGE = 100
const UI_PAGES_PER_BATCH = Math.ceil(GITHUB_PER_PAGE / UI_PAGE_SIZE)

function getOffset(batchPage: number, uiPage: number) {
  return ((batchPage - 1) * UI_PAGES_PER_BATCH + (uiPage - 1)) * UI_PAGE_SIZE
}

function toIso(value: Date | null) {
  return value?.toISOString() ?? ''
}

function releaseSortDate(row: typeof githubRelease.$inferSelect) {
  return row.publishedAt ?? row.createdAt
}

function releaseRowToItem(row: typeof githubRelease.$inferSelect): ReleaseItem {
  const originalDate = toIso(releaseSortDate(row))

  return {
    id: row.githubId,
    title: row.tagName,
    subtitle: row.name || row.description?.slice(0, 100) || 'No description',
    date: formatRelativeDate(originalDate),
    originalDate,
    url: row.url,
  }
}

function pullRequestRowToItem(row: typeof githubPullRequest.$inferSelect): PullRequestItem {
  let status: PullRequestItem['status']
  if (row.mergedAt) {
    status = 'Merged'
  } else if (row.state === 'open') {
    status = 'Open'
  } else {
    status = 'Closed'
  }

  const originalDate = toIso(row.updatedAt)

  return {
    id: row.githubId,
    title: row.title,
    subtitle: `#${row.number} by @${row.authorLogin}`,
    status,
    date: formatRelativeDate(originalDate),
    originalDate,
    url: row.url,
  }
}

function discussionRowToItem(row: typeof githubDiscussion.$inferSelect): DiscussionItem {
  const originalDate = toIso(row.updatedAt)

  return {
    id: row.githubId,
    title: row.title,
    subtitle: `Started by @${row.authorLogin ?? 'unknown'}`,
    status: row.answerChosenAt ? 'Answered' : 'Active',
    date: formatRelativeDate(originalDate),
    originalDate,
    url: row.url,
  }
}

export async function getCachedReleases(owner: string, repository: string, batchPage: number, uiPage: number): Promise<PaginatedBatchResult<ReleaseItem>> {
  const offset = getOffset(batchPage, uiPage)
  const rows = await db
    .select()
    .from(githubRelease)
    .where(and(eq(githubRelease.owner, owner), eq(githubRelease.repository, repository)))
    .orderBy(desc(sql`coalesce(${githubRelease.publishedAt}, ${githubRelease.createdAt})`))
    .limit(UI_PAGE_SIZE + 1)
    .offset(offset)

  return {
    items: rows.slice(0, UI_PAGE_SIZE).map(releaseRowToItem),
    batchPage,
    uiPage,
    totalFetched: offset + Math.min(rows.length, UI_PAGE_SIZE),
    hasMore: rows.length > UI_PAGE_SIZE,
  }
}

export async function getCachedPullRequests(owner: string, repository: string, batchPage: number, uiPage: number): Promise<PaginatedBatchResult<PullRequestItem>> {
  const offset = getOffset(batchPage, uiPage)
  const rows = await db
    .select()
    .from(githubPullRequest)
    .where(and(eq(githubPullRequest.owner, owner), eq(githubPullRequest.repository, repository)))
    .orderBy(desc(githubPullRequest.updatedAt))
    .limit(UI_PAGE_SIZE + 1)
    .offset(offset)

  return {
    items: rows.slice(0, UI_PAGE_SIZE).map(pullRequestRowToItem),
    batchPage,
    uiPage,
    totalFetched: offset + Math.min(rows.length, UI_PAGE_SIZE),
    hasMore: rows.length > UI_PAGE_SIZE,
  }
}

export async function getCachedDiscussions(owner: string, repository: string, batchPage: number, uiPage: number): Promise<PaginatedBatchResult<DiscussionItem>> {
  const offset = getOffset(batchPage, uiPage)
  const rows = await db
    .select()
    .from(githubDiscussion)
    .where(and(eq(githubDiscussion.owner, owner), eq(githubDiscussion.repository, repository)))
    .orderBy(desc(githubDiscussion.updatedAt))
    .limit(UI_PAGE_SIZE + 1)
    .offset(offset)

  return {
    items: rows.slice(0, UI_PAGE_SIZE).map(discussionRowToItem),
    batchPage,
    uiPage,
    totalFetched: offset + Math.min(rows.length, UI_PAGE_SIZE),
    hasMore: rows.length > UI_PAGE_SIZE,
  }
}

export async function upsertReleases(owner: string, repository: string, items: ReleaseItem[]) {
  if (items.length === 0) return

  const now = new Date()
  await db.insert(githubRelease).values(items.map((item) => ({
    id: `${owner}/${repository}/release/${item.id}`,
    githubId: item.id,
    owner,
    repository,
    tagName: item.title,
    name: item.subtitle === 'No description' ? null : item.subtitle,
    description: item.subtitle === 'No description' ? null : item.subtitle,
    url: item.url,
    createdAt: new Date(item.originalDate),
    publishedAt: new Date(item.originalDate),
    fetchedAt: now,
    lastSeenAt: now,
  }))).onConflictDoUpdate({
    target: [githubRelease.owner, githubRelease.repository, githubRelease.githubId],
    set: {
      tagName: sql`excluded.tag_name`,
      name: sql`excluded.name`,
      description: sql`excluded.description`,
      url: sql`excluded.url`,
      createdAt: sql`excluded.created_at`,
      publishedAt: sql`excluded.published_at`,
      fetchedAt: now,
      lastSeenAt: now,
    },
  })
}

export async function upsertPullRequests(owner: string, repository: string, items: PullRequestItem[]) {
  if (items.length === 0) return

  const now = new Date()
  await db.insert(githubPullRequest).values(items.map((item) => {
    const numberMatch = item.subtitle.match(/^#(\d+)/)
    const authorMatch = item.subtitle.match(/by @(.+)$/)

    return {
      id: `${owner}/${repository}/pull-request/${item.id}`,
      githubId: item.id,
      owner,
      repository,
      number: numberMatch ? Number(numberMatch[1]) : 0,
      title: item.title,
      state: item.status === 'Open' ? 'open' : 'closed',
      mergedAt: item.status === 'Merged' ? new Date(item.originalDate) : null,
      authorLogin: authorMatch?.[1] ?? 'unknown',
      url: item.url,
      createdAt: new Date(item.originalDate),
      updatedAt: new Date(item.originalDate),
      closedAt: item.status === 'Closed' ? new Date(item.originalDate) : null,
      fetchedAt: now,
      lastSeenAt: now,
    }
  })).onConflictDoUpdate({
    target: [githubPullRequest.owner, githubPullRequest.repository, githubPullRequest.githubId],
    set: {
      number: sql`excluded.number`,
      title: sql`excluded.title`,
      state: sql`excluded.state`,
      mergedAt: sql`excluded.merged_at`,
      authorLogin: sql`excluded.author_login`,
      url: sql`excluded.url`,
      createdAt: sql`excluded.created_at`,
      updatedAt: sql`excluded.updated_at`,
      closedAt: sql`excluded.closed_at`,
      fetchedAt: now,
      lastSeenAt: now,
    },
  })
}

export async function upsertDiscussions(owner: string, repository: string, items: DiscussionItem[]) {
  if (items.length === 0) return

  const now = new Date()
  await db.insert(githubDiscussion).values(items.map((item) => {
    const authorMatch = item.subtitle.match(/Started by @(.+)$/)

    return {
      id: `${owner}/${repository}/discussion/${item.id}`,
      githubId: item.id,
      owner,
      repository,
      number: 0,
      title: item.title,
      categoryName: null,
      authorLogin: authorMatch?.[1] ?? null,
      answerChosenAt: item.status === 'Answered' ? new Date(item.originalDate) : null,
      url: item.url,
      createdAt: new Date(item.originalDate),
      updatedAt: new Date(item.originalDate),
      fetchedAt: now,
      lastSeenAt: now,
    }
  })).onConflictDoUpdate({
    target: [githubDiscussion.owner, githubDiscussion.repository, githubDiscussion.githubId],
    set: {
      number: sql`excluded.number`,
      title: sql`excluded.title`,
      categoryName: sql`excluded.category_name`,
      authorLogin: sql`excluded.author_login`,
      answerChosenAt: sql`excluded.answer_chosen_at`,
      url: sql`excluded.url`,
      createdAt: sql`excluded.created_at`,
      updatedAt: sql`excluded.updated_at`,
      fetchedAt: now,
      lastSeenAt: now,
    },
  })
}
