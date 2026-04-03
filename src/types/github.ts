export interface GitHubRelease {
  id: number
  tag_name: string
  name: string | null
  body: string | null
  created_at: string
  published_at: string
  author: {
    login: string
  }
  html_url: string
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  state: string
  created_at: string
  updated_at: string
  closed_at: string | null
  merged_at: string | null
  user: {
    login: string
  }
  html_url: string
}

export interface GitHubDiscussion {
  id: string
  number: number
  title: string
  createdAt: string
  updatedAt: string
  author: {
    login: string
  } | null
  category: {
    name: string
  } | null
  answerChosenAt: string | null
  url: string
}

export interface ReleaseItem {
  id: string
  title: string
  subtitle: string
  date: string
  url: string
}

export interface PullRequestItem {
  id: string
  title: string
  subtitle: string
  status: 'Open' | 'Merged' | 'Closed'
  date: string
  url: string
}

export interface DiscussionItem {
  id: string
  title: string
  subtitle: string
  status: 'Active' | 'Answered'
  date: string
  url: string
}
