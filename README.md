# AI Agents Portfolio

> Practical AI projects for software engineering and test automation, spanning browser automation, LLM-powered test generation, Jira integrations, and retrieval-augmented generation.

This portfolio documents my journey from test automation engineering to AI engineering. The projects explore how LLMs, APIs, browser tooling, and retrieval systems can support real software testing workflows.

## Projects

| Project | Overview | Main technologies |
| --- | --- | --- |
| [AI Test Automation Browser Assistant](./projects/ai-test-automation-browser-assistant/ai-extension/) | Chrome side-panel extension that inspects the active page and generates test automation code. | Chrome Extension Manifest V3, JavaScript, Groq, OpenAI, Claude, Testleaf |
| [AI Testcase Chat](./projects/ai-testcase-chat/) | Two Langflow-powered interfaces for turning user stories into test cases and exporting results. | HTML, CSS, JavaScript, Langflow |
| [Jira User Story Agent](./projects/jira-user-story-agent/) | Full-stack app that imports Jira stories or accepts story details directly, generates test cases, and exports them. | React, TypeScript, Express, Jira REST API, Groq |
| [RAG Mongo Integration](./projects/rag-mongo-integration/) | Ingests test-case and user-story spreadsheets and searches the resulting MongoDB knowledge base. | React, Express, MongoDB Atlas Search, Mistral, Groq, Hugging Face |

## Project details

### AI Test Automation Browser Assistant

Located in [`projects/ai-test-automation-browser-assistant/ai-extension/`](./projects/ai-test-automation-browser-assistant/ai-extension/), this Manifest V3 Chrome extension provides a chat-based code generator in the browser side panel. It can inspect the active page, use that context to generate automation code, and switch between feature-file and page-class generation. Settings include Java, C#, Python, and TypeScript, browser automation frameworks (Selenium, Playwright, Cypress, and Puppeteer), and selectable LLM providers (Groq, OpenAI, Claude, and Testleaf).

Load the `ai-extension` folder as an unpacked extension in Chrome. Configure provider credentials in the extension settings; do not commit API keys.

### AI Testcase Chat

This project contains two browser-based implementations with sample stories for banking, finance, and insurance:

- [Version 1: external Langflow chat](./projects/ai-testcase-chat/version-1/external-chat-cdn/) embeds the Langflow chat widget. Choose or edit a sample story, copy the prompt into the chat, then paste the generated JSON into the export area to scan and download test cases as an Excel file.
- [Version 2: custom chat interface](./projects/ai-testcase-chat/version-2/custom-implementation/) provides its own chat UI for the Langflow API. It parses generated test cases and supports copying and downloading the results in spreadsheet-friendly formats.

Both implementations use local Langflow configuration. Version 2 includes [`config.example.js`](./projects/ai-testcase-chat/version-2/custom-implementation/config.example.js) as a starting point. Create local configuration as needed and keep credentials out of source control.

### Jira User Story Agent

Located in [`projects/jira-user-story-agent/`](./projects/jira-user-story-agent/), this TypeScript application combines a React frontend with an Express backend. Users can enter a story title, description, and acceptance criteria, or configure Jira access to select a story and populate the form. The backend generates structured test cases through the configured Groq-compatible API; results can be downloaded as JSON, CSV, or Excel-compatible files.

From the project directory, install dependencies with `npm install` and start the frontend and backend with `npm run dev`. Backend and Jira credentials are supplied through environment variables; do not commit real credentials.

### RAG Mongo Integration

Located in [`projects/rag-mongo-integration/`](./projects/rag-mongo-integration/), this full-stack application imports test-case and user-story spreadsheets, converts them to JSON, creates embeddings, and indexes the content in MongoDB Atlas. Its React interface supports:

- BM25 keyword search, vector search, and weighted hybrid search.
- Optional reranking and query preprocessing.
- Uploading source spreadsheets and starting embedding jobs with progress tracking.

Mistral provides embeddings, with Groq and Hugging Face integrations available for reranking. The repository includes an [environment-variable template](./projects/rag-mongo-integration/.env.example); configure MongoDB Atlas indexes and credentials before using the ingestion and search features. Start the application from the project directory with `npm run dev`.

## Technologies and themes

- JavaScript and TypeScript; React and Node.js
- LLM APIs and orchestration with Langflow, Groq, OpenAI, Mistral, Hugging Face, Claude, and Testleaf
- Jira REST API integration
- MongoDB Atlas Search, embeddings, and RAG
- Browser test automation with Selenium, Playwright, Cypress, and Puppeteer
- Prompt design and structured test-case generation

## About

I am a test automation engineer with 11+ years of experience in software testing and automation, expanding into AI engineering, LLM applications, RAG, and agentic AI systems. This portfolio captures practical experiments at the intersection of those fields.
