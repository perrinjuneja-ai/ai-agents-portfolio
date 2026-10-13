import { useState, useEffect } from 'react'
import { JiraProject, JiraUserStory } from '../types'
import {
  validateJiraConnection,
  fetchJiraProjects,
  fetchJiraStories,
  fetchJiraStoryDetails
} from '../api/jiraApi'

interface JiraConfigProps {
  onStorySelected: (story: JiraUserStory) => void
  onConfigChange: (config: { instanceUrl: string; email: string; apiKey: string }) => void
}

export function JiraConfig({ onStorySelected, onConfigChange }: JiraConfigProps) {
  const [instanceUrl, setInstanceUrl] = useState('')
  const [email, setEmail] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [isValidated, setIsValidated] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const [projects, setProjects] = useState<JiraProject[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [isFetchingProjects, setIsFetchingProjects] = useState(false)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  const [stories, setStories] = useState<JiraUserStory[]>([])
  const [selectedStory, setSelectedStory] = useState<string>('')
  const [isFetchingStories, setIsFetchingStories] = useState(false)
  const [storiesError, setStoriesError] = useState<string | null>(null)

  const [showConfig, setShowConfig] = useState(false)
  const [isBackendConfigured, setIsBackendConfigured] = useState(false)

  // Check if backend has Jira configured on mount
  useEffect(() => {
    checkBackendConfiguration()
  }, [])

  // Load config from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('jiraConfig')
    if (stored) {
      try {
        const config = JSON.parse(stored)
        setInstanceUrl(config.instanceUrl || '')
        setEmail(config.email || '')
        setApiKey(config.apiKey || '')
      } catch (e) {
        console.error('Failed to load Jira config from localStorage', e)
      }
    }
  }, [])

  // Check if Jira is configured in the backend
  const checkBackendConfiguration = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091/api'}/jira/config-status`
      )
      const data = await response.json()

      if (data.isConfigured && data.isValid) {
        setIsBackendConfigured(true)
        setIsValidated(true)
        setShowConfig(false)
        // Auto-fetch projects if backend is configured
        await handleFetchProjects()
      } else if (data.isConfigured && !data.isValid) {
        setIsBackendConfigured(true)
        setValidationError('Jira configured in backend but connection failed. Please check credentials.')
        setShowConfig(true)
      }
    } catch (error) {
      console.error('Failed to check backend configuration:', error)
    }
  }

  // Save config to localStorage
  const saveConfig = () => {
    const config = { instanceUrl, email, apiKey, isValidated }
    localStorage.setItem('jiraConfig', JSON.stringify(config))
    onConfigChange({ instanceUrl, email, apiKey })
  }

  // Validate Jira connection
  const handleValidate = async () => {
    if (!instanceUrl.trim() || !email.trim() || !apiKey.trim()) {
      setValidationError('All fields are required')
      return
    }

    setIsValidating(true)
    setValidationError(null)

    try {
      const result = await validateJiraConnection()
      if (result.isValid) {
        setIsValidated(true)
        saveConfig()
        setShowConfig(false)
        // Fetch projects after validation
        await handleFetchProjects()
      } else {
        setValidationError(result.message || 'Connection validation failed')
        setIsValidated(false)
      }
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Validation failed')
      setIsValidated(false)
    } finally {
      setIsValidating(false)
    }
  }

  // Fetch projects
  const handleFetchProjects = async () => {
    setIsFetchingProjects(true)
    setProjectsError(null)

    try {
      const result = await fetchJiraProjects()
      setProjects(result.projects)
      if (result.projects.length > 0) {
        setSelectedProject(result.projects[0].key)
        // Auto-fetch stories for first project
        await handleFetchStories(result.projects[0].key)
      }
    } catch (error) {
      setProjectsError(error instanceof Error ? error.message : 'Failed to fetch projects')
    } finally {
      setIsFetchingProjects(false)
    }
  }

  // Fetch stories for selected project
  const handleFetchStories = async (projectKey: string) => {
    if (!projectKey) return

    setIsFetchingStories(true)
    setStoriesError(null)
    setStories([])
    setSelectedStory('')

    try {
      const result = await fetchJiraStories(projectKey)
      setStories(result.stories)
      if (result.stories.length > 0) {
        setSelectedStory(result.stories[0].key)
      }
    } catch (error) {
      setStoriesError(error instanceof Error ? error.message : 'Failed to fetch stories')
    } finally {
      setIsFetchingStories(false)
    }
  }

  // Handle project selection change
  const handleProjectChange = (projectKey: string) => {
    setSelectedProject(projectKey)
    handleFetchStories(projectKey)
  }

  // Handle story selection change
  const handleStoryChange = async (storyKey: string) => {
    setSelectedStory(storyKey)
    if (storyKey) {
      try {
        const story = await fetchJiraStoryDetails(storyKey)
        onStorySelected(story)
      } catch (error) {
        console.error('Failed to fetch story details:', error)
      }
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>📋 Jira Integration</h3>
        {isValidated && (
          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              ...styles.button,
              ...(showConfig ? styles.buttonActive : {})
            }}
          >
            ⚙️ Edit Config
          </button>
        )}
        {!isValidated && !isBackendConfigured && (
          <button
            onClick={() => setShowConfig(!showConfig)}
            style={{
              ...styles.button,
              ...(showConfig ? styles.buttonActive : {})
            }}
          >
            ⚙️ Configure
          </button>
        )}
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div style={styles.configPanel}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Instance URL *</label>
            <input
              type="text"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              placeholder="https://your-instance.atlassian.net"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@gmail.com"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>API Key *</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your Jira API token"
              style={styles.input}
            />
          </div>

          {validationError && (
            <div style={styles.errorBanner}>
              ❌ {validationError}
            </div>
          )}

          <button
            onClick={handleValidate}
            disabled={isValidating}
            style={{
              ...styles.button,
              ...(isValidating ? styles.buttonDisabled : {})
            }}
          >
            {isValidating ? '⏳ Validating...' : '✓ Validate Connection'}
          </button>
        </div>
      )}

      {/* Dropdowns - Show only if validated */}
      {isValidated && !showConfig && (
        <div style={styles.dropdownsContainer}>
          {/* Project Dropdown */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Project {isFetchingProjects && '(Loading...)'}
            </label>
            <select
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
              disabled={isFetchingProjects || projects.length === 0}
              style={{
                ...styles.input,
                ...(isFetchingProjects ? styles.inputDisabled : {})
              }}
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.key} value={project.key}>
                  {project.name} ({project.key})
                </option>
              ))}
            </select>
            {projectsError && <div style={styles.errorMessage}>❌ {projectsError}</div>}
          </div>

          {/* Story Dropdown */}
          {selectedProject && (
            <div style={styles.formGroup}>
              <label style={styles.label}>
                User Story {isFetchingStories && '(Loading...)'}
              </label>
              <select
                value={selectedStory}
                onChange={(e) => handleStoryChange(e.target.value)}
                disabled={isFetchingStories || stories.length === 0}
                style={{
                  ...styles.input,
                  ...(isFetchingStories ? styles.inputDisabled : {})
                }}
              >
                <option value="">Select a user story...</option>
                {stories.map((story) => (
                  <option key={story.key} value={story.key}>
                    {story.key} - {story.title}
                  </option>
                ))}
              </select>
              {storiesError && <div style={styles.errorMessage}>❌ {storiesError}</div>}
            </div>
          )}

          {/* Status Badge */}
          <div style={styles.statusBadge}>
            {isBackendConfigured ? '🟢 Configured in Backend' : '🟢 Connected to Jira'}
          </div>
        </div>
      )}

      {/* Not Validated Message */}
      {!isValidated && !showConfig && !isBackendConfigured && (
        <div style={styles.notValidatedMessage}>
          ⚠️ Jira not configured. Click "Configure" to get started.
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e1e8ed',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  } as const,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  } as const,
  title: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '16px',
    fontWeight: '600'
  } as const,
  button: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  } as const,
  buttonActive: {
    backgroundColor: '#f39c12'
  } as const,
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
    cursor: 'not-allowed'
  } as const,
  configPanel: {
    backgroundColor: 'white',
    border: '1px solid #e1e8ed',
    borderRadius: '6px',
    padding: '15px',
    marginBottom: '15px'
  } as const,
  dropdownsContainer: {
    backgroundColor: 'white',
    border: '1px solid #e1e8ed',
    borderRadius: '6px',
    padding: '15px'
  } as const,
  formGroup: {
    marginBottom: '15px'
  } as const,
  label: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '6px',
    color: '#2c3e50',
    fontSize: '14px'
  } as const,
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #e1e8ed',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit'
  } as const,
  inputDisabled: {
    backgroundColor: '#f8f9fa',
    cursor: 'not-allowed'
  } as const,
  errorBanner: {
    backgroundColor: '#fee',
    color: '#e74c3c',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontSize: '14px',
    border: '1px solid #fcc'
  } as const,
  errorMessage: {
    color: '#e74c3c',
    fontSize: '12px',
    marginTop: '5px'
  } as const,
  notValidatedMessage: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '14px',
    border: '1px solid #ffeeba'
  } as const,
  statusBadge: {
    backgroundColor: '#e8f5e9',
    color: '#27ae60',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '14px',
    marginTop: '10px',
    border: '1px solid #c8e6c9'
  } as const
}
