export interface GenerateRequest {
  storyTitle: string
  acceptanceCriteria: string
  description?: string
  additionalInfo?: string
}

export interface TestCase {
  id: string
  title: string
  priority: string
  steps: string[]
  testData?: string
  expectedResult: string
  category: string
}

export interface GenerateResponse {
  cases: TestCase[]
  model?: string
  promptTokens: number
  completionTokens: number
}

// Jira Types
export interface JiraProject {
  key: string
  name: string
  id: string
}

export interface JiraUserStory {
  key: string
  title: string
  description: string | null
  status: string
  acceptanceCriteria?: string
}

export interface JiraConfig {
  instanceUrl: string
  email: string
  apiKey: string
}

export interface JiraValidateResponse {
  isValid: boolean
  message: string
}

export interface JiraProjectsResponse {
  projects: JiraProject[]
  count: number
}

export interface JiraStoriesResponse {
  stories: JiraUserStory[]
  count: number
  projectKey: string
}