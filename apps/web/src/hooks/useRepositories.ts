import { useQuery } from '@tanstack/react-query'
import repositories from '../data/repositories.json'
import type { Repository, RepositoryWithId } from '../types/repository'
import { getRepoId } from '../types/repository'

const REPOSITORIES_KEY = 'repositories'

async function fetchRepositories(): Promise<RepositoryWithId[]> {
  const repos = repositories as Repository[]
  return repos.map((repo) => ({
    ...repo,
    id: getRepoId(repo),
  }))
}

export const repositoriesQueryOptions = {
  queryKey: [REPOSITORIES_KEY],
  queryFn: fetchRepositories,
  staleTime: 5 * 60 * 1000,
}

export function useRepositories(options?: { enabled?: boolean }) {
  return useQuery({
    ...repositoriesQueryOptions,
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
