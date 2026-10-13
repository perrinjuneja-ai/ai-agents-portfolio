import { z } from 'zod'

export const GenerateRequestSchema = z.object({
  storyTitle: z.string().min(1, 'Story title is required'),
  acceptanceCriteria: z.string().min(1, 'Acceptance criteria is required'),
  description: z.string().optional(),
  additionalInfo: z.string().optional()
})

export const TestCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.string(),
  steps: z.array(z.string()),
  testData: z.string().optional(),
  expectedResult: z.string(),
  category: z.string()
})

export const GenerateResponseSchema = z.object({
  cases: z.array(TestCaseSchema),
  model: z.string().optional(),
  promptTokens: z.number(),
  completionTokens: z.number()
})

// Jira schemas
export const JiraProjectSchema = z.object({
  key: z.string(),
  name: z.string(),
  id: z.string()
})

export const JiraUserStorySchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  acceptanceCriteria: z.string().optional()
})

export const JiraValidateResponseSchema = z.object({
  isValid: z.boolean(),
  message: z.string()
})

export const JiraProjectsResponseSchema = z.object({
  projects: z.array(JiraProjectSchema),
  count: z.number()
})

export const JiraStoriesResponseSchema = z.object({
  stories: z.array(JiraUserStorySchema),
  count: z.number(),
  projectKey: z.string()
})

// Type exports
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>
export type TestCase = z.infer<typeof TestCaseSchema>
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>
export type JiraProject = z.infer<typeof JiraProjectSchema>
export type JiraUserStory = z.infer<typeof JiraUserStorySchema>
export type JiraValidateResponse = z.infer<typeof JiraValidateResponseSchema>
export type JiraProjectsResponse = z.infer<typeof JiraProjectsResponseSchema>
export type JiraStoriesResponse = z.infer<typeof JiraStoriesResponseSchema>