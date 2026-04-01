export interface Repository {
  owner: string
  repository: string
}

export interface RepositoryWithId extends Repository {
  id: string
}

export function getRepoId(repo: Repository): string {
  return `${repo.owner}/${repo.repository}`
}

export function parseRepoId(id: string): Repository {
  const [owner, repository] = id.split('/')
  return { owner, repository }
}
