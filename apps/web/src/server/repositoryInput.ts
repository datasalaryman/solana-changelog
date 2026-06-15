import * as z from 'zod'
import repositories from '../data/repositories.json'

export const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/
export const REPOSITORY_PATTERN = /^[A-Za-z0-9._-]{1,100}$/
export const MIN_PAGE = 1
export const MAX_PAGE = 100
export const MAX_CURSOR_LENGTH = 512

const ownerSchema = z.string().regex(OWNER_PATTERN, 'Invalid GitHub owner')
const repositorySchema = z
  .string()
  .regex(REPOSITORY_PATTERN, 'Invalid GitHub repository')
  .refine((repository) => repository !== '.' && repository !== '..', 'Invalid GitHub repository')

const repoFields = {
  owner: ownerSchema,
  repository: repositorySchema,
}

const configuredRepositorySchema = z.object(repoFields)

for (const repository of repositories) {
  configuredRepositorySchema.parse(repository)
}

export const allowedRepositories = new Set(
  repositories.map(({ owner, repository }) => `${owner}/${repository}`)
)

function validateAllowedRepository(
  input: { owner: string; repository: string },
  context: z.RefinementCtx
) {
  if (!allowedRepositories.has(`${input.owner}/${input.repository}`)) {
    context.addIssue({
      code: 'custom',
      message: 'Repository is not supported',
      path: ['repository'],
    })
  }
}

const pageSchema = z.number().int().min(MIN_PAGE).max(MAX_PAGE).default(MIN_PAGE)
const cursorSchema = z
  .string()
  .min(1)
  .max(MAX_CURSOR_LENGTH)
  .regex(/^[^\x00-\x1F\x7F]*$/, 'Invalid GitHub cursor')
  .nullable()
  .default(null)

export const repoInput = z.object(repoFields).superRefine(validateAllowedRepository)

export const batchInput = z
  .object({
    ...repoFields,
    batchPage: pageSchema,
    uiPage: pageSchema,
  })
  .superRefine(validateAllowedRepository)

export const discussionsInput = z
  .object({
    ...repoFields,
    cursor: cursorSchema,
    uiPage: pageSchema,
  })
  .superRefine(validateAllowedRepository)
