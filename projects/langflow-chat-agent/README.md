# Langflow Test Case Generator

A static web app for drafting test-case prompts from sample banking, finance, and insurance user stories, sending them to a Langflow chat, and exporting the generated cases to an Excel workbook.

## Features

- Sample user stories for banking, finance, and insurance.
- Prompt editor with copy-to-clipboard support. Prompts are copied manually into the chat; they are not sent automatically.
- Embedded Langflow chat widget.
- Light/dark theme toggle with the selection saved in browser storage.
- Test-case parser for JSON arrays and common labeled plain-text responses.
- Excel (`.xlsx`) export with `Id`, `Title`, `Preconditions`, `Steps`, `Expected`, and `Priority` columns.
- Responsive page layout for smaller screens.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, sample stories, CDN dependencies, and application script references. |
| `app.js` | Initializes the Langflow chat, handles prompts and theme selection, parses test-case output, and creates the Excel workbook. |
| `style.css` | Page and responsive layout styles. |
| `config.example.js` | Safe template for the local Langflow configuration. Copy it to the ignored `config.js` and add your own API key. |
| `custom-html-for-langflow-chat.md` | Original project brief and Langflow setup example. |

## Requirements

- A modern browser with JavaScript enabled.
- Python 3 (or another static HTTP server) to serve the page locally.
- A running Langflow instance reachable by the browser at the configured host, currently `http://localhost:7860`.
- The configured Langflow flow. Its flow ID is currently set in `app.js`.
- Internet access to load the Langflow chat and SheetJS libraries from their CDNs.

There is no package manager setup or build step.

## Run locally

1. Start Langflow and make sure your flow is available. The default host is `http://localhost:7860`; the flow ID is set in `app.js`.
2. In PowerShell, from the project directory, create your local configuration from the template:

   ```powershell
   Set-Location C:\Users\perri\ai-agents-portfolio\projects\langflow-chat-agent
   Copy-Item config.example.js config.js
   ```

3. Edit `config.js` and replace `YOUR_LANGFLOW_API_KEY` with your own Langflow API key. This file is excluded by `.gitignore`; do not force-add it to Git.
4. Start the local web server from the project directory:

   ```powershell
   python -m http.server 8000
   ```

   If `python` is not available, try `py -m http.server 8000`.
5. Open [http://localhost:8000](http://localhost:8000) in your browser. Keep the server running while you use the app; press **Ctrl+C** in the PowerShell window to stop it.

Serving the page from `localhost` also provides a secure context for the browser Clipboard API used by **Copy Prompt**.

## Use the app

1. Choose a sample story. Its prompt appears in the prompt editor.
2. Edit it if needed, select **Copy Prompt**, then paste it into the Langflow chat and submit it.
3. Ask the flow to return test cases, preferably as a JSON array using the format below.
4. Copy the generated response from the chat into the **Excel-ready output** text area.
5. Select **Scan chat output**. When test cases are detected, **Export to Excel** becomes available.
6. Select **Export to Excel** to download a timestamped `.xlsx` workbook.

The export parser accepts a JSON array or plain-text test-case blocks labeled with `Test Case ID`, `Title`, `Preconditions`, `Steps`, and `Expected` (also `Expected Result` or `Expected Outcome`). For the most predictable results, use a JSON array:

```json
[
  {
    "id": "TC-001",
    "title": "A descriptive test case title",
    "preconditions": "Required account or system state",
    "steps": ["Perform an action", "Verify the result"],
    "expected": "The expected outcome",
    "priority": "High"
  }
]
```

## Credential safety

This is a **static browser app**. Any API key used by the page is sent to the browser and can be inspected by visitors; JavaScript obfuscation or masking cannot make it secret. The real key must never be committed or deployed in `config.js`.

`config.js` is a local-only file ignored by Git. The public project includes `config.example.js` without credentials. To use the app, copy the example to `config.js` and supply your own key. Visitors to a public static deployment must configure their own Langflow host, flow, and API key; a static-only deployment cannot privately share your key while allowing everyone to use your Langflow flow.

For a public app that works for visitors without exposing a shared key, add a server-side proxy or backend and store the key as a server-side secret. Rotate any key that has previously been exposed or shared.
