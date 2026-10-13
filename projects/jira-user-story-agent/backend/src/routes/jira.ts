import { Router, Request, Response } from 'express'
import { JiraClient } from '../jira/jiraClient'
import {
  JiraValidateResponseSchema,
  JiraProjectsResponseSchema,
  JiraStoriesResponseSchema
} from '../schemas'

const router = Router()

// Lazy initialize JiraClient - it will be created only when first needed,
// ensuring .env variables are loaded first
let jiraClient: JiraClient | null = null

function getJiraClient(): JiraClient {
  if (!jiraClient) {
    jiraClient = new JiraClient()
  }
  return jiraClient
}

/**
 * GET /api/jira/config-status
 * Checks if Jira is configured in environment and validates connection
 */
router.get('/config-status', async (req: Request, res: Response) => {
  try {
    const isConfigured = !!(
      process.env.JIRA_INSTANCE_URL &&
      process.env.JIRA_EMAIL &&
      process.env.JIRA_API_KEY
    )

    if (!isConfigured) {
      return res.json({
        isConfigured: false,
        isValid: false,
        message: 'Jira not configured in environment variables'
      })
    }

    console.log('🔍 Checking Jira configuration status...')
    const isValid = await getJiraClient().validateConnection()

    return res.json({
      isConfigured: true,
      isValid,
      message: isValid ? 'Jira configured and connected' : 'Jira configured but connection failed'
    })
  } catch (error) {
    console.error('Error checking Jira config status:', error)
    return res.json({
      isConfigured: !!process.env.JIRA_INSTANCE_URL,
      isValid: false,
      message: error instanceof Error ? error.message : 'Failed to check Jira status'
    })
  }
})

/**
 * POST /api/jira/validate
 * Validates Jira connection with configured credentials
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    console.log('🔍 Validating Jira connection...')
    const isValid = await getJiraClient().validateConnection()

    const response = JiraValidateResponseSchema.parse({
      isValid,
      message: isValid ? 'Jira connection successful' : 'Jira connection failed'
    })

    res.json(response)
  } catch (error) {
    console.error('Error validating Jira connection:', error)
    res.status(500).json({
      isValid: false,
      message: error instanceof Error ? error.message : 'Failed to validate Jira connection'
    })
  }
})

/**
 * GET /api/jira/projects
 * Fetches all available Jira projects
 */
router.get('/projects', async (req: Request, res: Response) => {
  try {
    console.log('📂 Fetching projects...')
    const projects = await getJiraClient().fetchProjects()

    const response = JiraProjectsResponseSchema.parse({
      projects,
      count: projects.length
    })

    res.json(response)
  } catch (error) {
    console.error('Error fetching projects:', error)
    res.status(500).json({
      projects: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch projects'
    })
  }
})

/**
 * GET /api/jira/stories?projectKey=XXX
 * Fetches user stories for a specific project
 */
router.get('/stories', async (req: Request, res: Response) => {
  try {
    const projectKey = req.query.projectKey as string

    if (!projectKey) {
      res.status(400).json({
        stories: [],
        count: 0,
        projectKey: '',
        error: 'projectKey query parameter is required'
      })
      return
    }

    console.log(`📖 Fetching stories for project: ${projectKey}`)
    const stories = await getJiraClient().fetchUserStories(projectKey)

    const response = JiraStoriesResponseSchema.parse({
      stories,
      count: stories.length,
      projectKey
    })

    res.json(response)
  } catch (error) {
    console.error('Error fetching stories:', error)
    res.status(500).json({
      stories: [],
      count: 0,
      projectKey: req.query.projectKey || '',
      error: error instanceof Error ? error.message : 'Failed to fetch stories'
    })
  }
})

/**
 * GET /api/jira/story/:issueKey
 * Fetches details for a specific Jira issue/story
 */
router.get('/story/:issueKey', async (req: Request, res: Response) => {
  try {
    const issueKey = req.params.issueKey

    console.log(`📄 Fetching story details: ${issueKey}`)
    const story = await getJiraClient().fetchStoryDetails(issueKey)

    if (!story) {
      res.status(404).json({
        error: 'Story not found'
      })
      return
    }

    res.json(story)
  } catch (error) {
    console.error('Error fetching story:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch story'
    })
  }
})

export default router
