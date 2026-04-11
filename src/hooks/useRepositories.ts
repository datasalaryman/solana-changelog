import { useQuery } from '@tanstack/react-query'
import type { Repository, RepositoryWithId } from '../types/repository'
import { getRepoId } from '../types/repository'

const REPOSITORIES_KEY = 'repositories'

async function fetchRepositories(): Promise<RepositoryWithId[]> {
  const response = await fetch('/repositories.json')
  if (!response.ok) {
    throw new Error('Failed to fetch repositories')
  }
  const repos: Repository[] = await response.json()
  return repos.map((repo) => ({
    ...repo,
    id: getRepoId(repo),
  }))
}

export function useRepositories(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [REPOSITORIES_KEY],
    queryFn: fetchRepositories,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  })
}

export function useRepository(id: string) {
  const { data: repositories, ...rest } = useRepositories()
  
  const repository = repositories?.find((repo) => repo.id === id)
  
  return {
    data: repository,
    ...rest,
  }
}
