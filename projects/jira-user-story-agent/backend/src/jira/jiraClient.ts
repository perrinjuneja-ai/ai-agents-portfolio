import fetch from 'node-fetch'

export interface JiraProject {
  key: string
  name: string
  id: string
}

export interface JiraIssue {
  key: string
  fields: {
    summary: string
    description: string | null
    status: {
      name: string
    }
    [key: string]: any // Allow any custom fields
  }
}

export interface JiraUserStory {
  key: string
  title: string
  description: string | null
  status: string
  acceptanceCriteria?: string
}

export class JiraClient {
  private email: string
  private apiKey: string
  private instanceUrl: string

  constructor() {
    this.email = process.env.JIRA_EMAIL || ''
    this.apiKey = process.env.JIRA_API_KEY || ''
    this.instanceUrl = process.env.JIRA_INSTANCE_URL || 'https://your-instance.atlassian.net'

    if (!this.email || !this.apiKey) {
      console.warn('⚠️  Jira credentials not configured. Set JIRA_EMAIL and JIRA_API_KEY')
    } else {
      console.log('✅ Jira client initialized')
      console.log(`📍 Instance: ${this.instanceUrl}`)
      console.log(`👤 Email: ${this.email}`)
    }
  }

  private getAuthHeader(): string {
    const credentials = `${this.email}:${this.apiKey}`
    const encoded = Buffer.from(credentials).toString('base64')
    return `Basic ${encoded}`
  }

  async validateConnection(): Promise<boolean> {
    console.log('🔍 Validating Jira connection...')
    const endpoint = `${this.instanceUrl}/rest/api/3/myself`

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      })

      console.log(`📊 Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`❌ Validation failed: ${errorText}`)
        return false
      }

      const data = await response.json() as any
      console.log(`✅ Connection valid. User: ${data.displayName}`)
      return true
    } catch (error) {
      console.error('❌ Error validating Jira connection:', error)
      return false
    }
  }

  async fetchProjects(): Promise<JiraProject[]> {
    console.log('📂 Fetching Jira projects...')
    const endpoint = `${this.instanceUrl}/rest/api/3/project/search?maxResults=50`

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      })

      console.log(`📊 Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`❌ Error: ${errorText}`)
        throw new Error(`Jira API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json() as any
      const projects: JiraProject[] = data.values.map((project: any) => ({
        key: project.key,
        name: project.name,
        id: project.id
      }))

      console.log(`✅ Found ${projects.length} projects`)
      return projects
    } catch (error) {
      console.error('❌ Error fetching projects:', error)
      throw error
    }
  }

  // Helper function to extract text from Atlassian Document Format (ADF)
  private extractTextFromADF(adfContent: any): string {
    if (!adfContent || typeof adfContent !== 'object') {
      return ''
    }

    let text = ''

    // Recursively extract text from ADF content
    const extractText = (node: any): void => {
      if (!node) return

      // If node has 'text' property, add it
      if (node.text) {
        text += node.text
      }

      // If node has 'content' array, process each item
      if (Array.isArray(node.content)) {
        node.content.forEach((child: any) => {
          extractText(child)
        })
      }

      // Add space after paragraphs
      if (node.type === 'paragraph' && text && !text.endsWith(' ')) {
        text += ' '
      }
    }

    extractText(adfContent)
    return text.trim()
  }

  // Helper function to find and extract custom field values
  private findCustomFieldValue(fields: any, fieldName: string): string {
    console.log(`🔍 Searching for "${fieldName}" in fields...`)
    console.log(`📋 Available custom fields:`, Object.keys(fields).filter(k => k.startsWith('customfield_')))
    
    // Look for custom fields that match the field name
    for (const key in fields) {
      const field = fields[key]
      
      // Check if this is a custom field key (customfield_XXXXX format)
      if (key.startsWith('customfield_')) {
        // Try to match by field name in metadata (this is a workaround)
        // In production, you'd want to use the Jira field metadata API
        if (key.includes('acceptanc') || fieldName.toLowerCase().includes('acceptanc')) {
          console.log(`✅ Found acceptance criteria field: ${key} = ${JSON.stringify(field)}`)
          if (field) {
            if (typeof field === 'string') {
              console.log(`📝 Extracted string value: ${field}`)
              return field
            } else if (typeof field === 'object' && field.type === 'doc') {
              // Handle ADF (Atlassian Document Format) for custom fields
              const extractedText = this.extractTextFromADF(field)
              console.log(`📝 Extracted ADF text: ${extractedText}`)
              return extractedText
            } else if (typeof field === 'object' && field.value) {
              console.log(`📝 Extracted object.value: ${field.value}`)
              return field.value
            } else if (typeof field === 'object' && field.text) {
              console.log(`📝 Extracted object.text: ${field.text}`)
              return field.text
            } else if (Array.isArray(field) && field.length > 0) {
              const extractedArray = field.map((item: any) => typeof item === 'string' ? item : item.name || item.value).join(', ')
              console.log(`📝 Extracted array: ${extractedArray}`)
              return extractedArray
            }
          }
        }
      }
    }
    
    // Also check if the field exists directly with a key containing the field name
    for (const key in fields) {
      if (key.toLowerCase().includes('acceptanc') && fields[key]) {
        const field = fields[key]
        console.log(`✅ Found acceptance criteria field: ${key} = ${JSON.stringify(field)}`)
        if (typeof field === 'string') {
          console.log(`📝 Extracted string value: ${field}`)
          return field
        } else if (typeof field === 'object' && field.type === 'doc') {
          // Handle ADF (Atlassian Document Format) for custom fields
          const extractedText = this.extractTextFromADF(field)
          console.log(`📝 Extracted ADF text: ${extractedText}`)
          return extractedText
        } else if (typeof field === 'object') {
          if (field.value) {
            console.log(`📝 Extracted object.value: ${field.value}`)
            return field.value
          }
          if (field.text) {
            console.log(`📝 Extracted object.text: ${field.text}`)
            return field.text
          }
          if (Array.isArray(field)) {
            const extractedArray = field.map((item: any) => typeof item === 'string' ? item : item.name || item.value).join(', ')
            console.log(`📝 Extracted array: ${extractedArray}`)
            return extractedArray
          }
        }
      }
    }
    
    console.log(`⚠️  No "${fieldName}" field found`)
    return ''
  }

  async fetchUserStories(projectKey: string): Promise<JiraUserStory[]> {
    console.log(`📖 Fetching user stories for project: ${projectKey}`)
    
    // JQL: Fetch issues from project that are either Story or Task type
    const jql = `project = "${projectKey}" AND type in (Story, Task)`
    const endpoint = `${this.instanceUrl}/rest/api/3/search/jql`

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jql,  // Use 'jql' not 'query'
          fields: ['*all'],  // Request all fields including custom fields
          maxResults: 100
        })
      })

      console.log(`📊 Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`❌ Error: ${errorText}`)
        throw new Error(`Jira API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json() as any
      console.log(`📄 Raw Jira response:`, JSON.stringify(data).substring(0, 1000))
      
      // /rest/api/3/search/jql returns data in different structures - check which one
      const issuesArray = data.values || data.issues || data.data || []
      console.log(`📄 Found ${issuesArray.length} issues in response`)
      
      const stories: JiraUserStory[] = issuesArray.map((issue: JiraIssue) => {
        // Handle description - it can be either a string or an ADF object
        let description = ''
        if (issue.fields.description) {
          if (typeof issue.fields.description === 'string') {
            description = issue.fields.description
          } else if (typeof issue.fields.description === 'object') {
            // Jira API v3 returns description as ADF (Atlassian Document Format)
            // Extract text from the ADF structure
            description = this.extractTextFromADF(issue.fields.description)
          }
        }

        // Extract Acceptance Criteria custom field
        const acceptanceCriteria = this.findCustomFieldValue(issue.fields, 'Acceptance Criteria')
        
        return {
          key: issue.key,
          title: issue.fields.summary,
          description,
          status: issue.fields.status.name,
          acceptanceCriteria: acceptanceCriteria || undefined
        }
      })

      console.log(`✅ Found ${stories.length} user stories`)
      return stories
    } catch (error) {
      console.error('❌ Error fetching user stories:', error)
      throw error
    }
  }

  async fetchStoryDetails(issueKey: string): Promise<JiraUserStory | null> {
    console.log(`📄 Fetching details for issue: ${issueKey}`)
    const endpoint = `${this.instanceUrl}/rest/api/3/issue/${issueKey}?fields=*all`  // Request all fields including custom fields

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      })

      console.log(`📊 Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`❌ Error: ${errorText}`)
        return null
      }

      const data = await response.json() as any
      
      // Handle description - it can be either a string or an ADF object
      let description = ''
      if (data.fields.description) {
        if (typeof data.fields.description === 'string') {
          description = data.fields.description
        } else if (typeof data.fields.description === 'object') {
          // Jira API v3 returns description as ADF (Atlassian Document Format)
          description = this.extractTextFromADF(data.fields.description)
        }
      }

      // Extract Acceptance Criteria custom field
      const acceptanceCriteria = this.findCustomFieldValue(data.fields, 'Acceptance Criteria')
      
      const story: JiraUserStory = {
        key: data.key,
        title: data.fields.summary,
        description,
        status: data.fields.status.name,
        acceptanceCriteria: acceptanceCriteria || undefined
      }

      console.log(`✅ Retrieved story: ${story.title}`)
      return story
    } catch (error) {
      console.error('❌ Error fetching story details:', error)
      return null
    }
  }
}
