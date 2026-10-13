import {
  JiraValidateResponse,
  JiraProjectsResponse,
  JiraStoriesResponse,
  JiraUserStory
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091/api'

/**
 * Validate Jira connection
 */
export async function validateJiraConnection(): Promise<JiraValidateResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/jira/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const data: JiraValidateResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error validating Jira connection:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred')
  }
}

/**
 * Fetch all Jira projects
 */
export async function fetchJiraProjects(): Promise<JiraProjectsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/jira/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data: JiraProjectsResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching projects:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred')
  }
}

/**
 * Fetch user stories for a specific project
 */
export async function fetchJiraStories(projectKey: string): Promise<JiraStoriesResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/jira/stories?projectKey=${encodeURIComponent(projectKey)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data: JiraStoriesResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching stories:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred')
  }
}

/**
 * Fetch details for a specific story
 */
export async function fetchJiraStoryDetails(issueKey: string): Promise<JiraUserStory> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/jira/story/${encodeURIComponent(issueKey)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data: JiraUserStory = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching story details:', error)
    throw error instanceof Error ? error : new Error('Unknown error occurred')
  }
}
