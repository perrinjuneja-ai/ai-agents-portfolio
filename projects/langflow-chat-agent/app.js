document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const storyButtons = document.querySelectorAll('[data-prompt]');
  const promptInput = document.getElementById('promptInput');
  const copyPrompt = document.getElementById('copyPrompt');
  const focusChat = document.getElementById('focusChat');
  const scanChatBtn = document.getElementById('scanChatBtn');
  const exportBtn = document.getElementById('exportBtn');
  const rawJsonInput = document.getElementById('rawJsonInput');
  const exportStatus = document.getElementById('exportStatus');
  const chatWrapper = document.getElementById('chatWrapper');
  let parsedTestcases = [];

  if (chatWrapper && typeof LANGFLOW_API_KEY !== 'undefined' && typeof LANGFLOW_HOST_URL !== 'undefined') {
    const chatElement = document.createElement('langflow-chat');
    chatElement.id = 'langflowChat';
    chatElement.setAttribute('host_url', LANGFLOW_HOST_URL);
    chatElement.setAttribute('flow_id', '2908c40a-7632-4c5e-a0e2-4c2f8a997452');
    chatElement.setAttribute('api_key', LANGFLOW_API_KEY);
    chatElement.setAttribute('bot_message_style', '{"color":"#54927","backgroundColor":"#CCF527"}');
    chatElement.setAttribute('chat_window_style', '{"borderRadius":"6px","boxShadow":"0 2px 8px rgba(0,0,0,0.1)"}');
    chatElement.style.display = 'block';
    chatElement.style.width = '100%';
    chatElement.style.minHeight = '560px';

    // Attempt to request embedded/panel rendering mode from the langflow widget.
    // Many web widgets accept attributes like `mode`, `embed`, `display` or `position`.
    // Setting these attributes is safe even if the widget does not recognize them.
    const embedHints = {
      mode: 'embed',
      embed: 'true',
      display: 'embedded',
      position: 'inline',
      view: 'panel'
    };
    Object.entries(embedHints).forEach(([k, v]) => {
      try { chatElement.setAttribute(k, v); } catch (e) { /* ignore */ }
    });
    // Also set a `start_open` hint to encourage full-panel rendering
    chatElement.setAttribute('start_open', 'true');
    chatElement.setAttribute('start_open', 'true');
    chatElement.setAttribute('placeholder', 'Give your input for generating testcases');
    chatElement.setAttribute('placeholder_sending', 'Generating testcases');
    chatElement.setAttribute('window_title', 'Testcase Generator Chat');
    chatWrapper.innerHTML = '';
    chatWrapper.appendChild(chatElement);
  }

  const savedTheme = localStorage.getItem('tf_theme');
  if (savedTheme) {
    const isDarkSaved = savedTheme === 'dark';
    document.body.classList.toggle('dark', isDarkSaved);
    document.body.classList.toggle('light', !isDarkSaved);
    themeToggle.checked = isDarkSaved;
  } else {
    // default to light mode
    document.body.classList.remove('dark');
    document.body.classList.add('light');
    themeToggle.checked = false;
  }

  themeToggle.addEventListener('change', () => {
    const isDark = themeToggle.checked;
    document.body.classList.toggle('dark', isDark);
    document.body.classList.toggle('light', !isDark);
    localStorage.setItem('tf_theme', isDark ? 'dark' : 'light');
  });

  storyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const prompt = button.dataset.prompt;
      if (!prompt) return;
      promptInput.value = prompt;
      updateStatus('Story prompt selected. Edit or copy it manually into the chat.');
    });
  });

  copyPrompt.addEventListener('click', async () => {
    const value = promptInput.value.trim();
    if (!value) {
      updateStatus('Please select or enter a prompt before copying.', true);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      updateStatus('Prompt copied to clipboard. Paste it into the Langflow chat input.');
    } catch (err) {
      updateStatus('Unable to copy prompt. Use manual selection instead.', true);
    }
  });

  focusChat.addEventListener('click', () => {
    const chatWidget = document.getElementById('langflowChat');
    if (chatWidget && typeof chatWidget.focus === 'function') {
      chatWidget.focus();
      updateStatus('Chat widget focused.');
    } else {
      updateStatus('Click inside the chat window to start typing your prompt.', false);
    }
  });

  const normalizeText = (text) => text.replace(/```[\s\S]*?```/g, (match) => match.replace(/\r?\n/g, '\n')).trim();

  const extractJsonBlock = (text) => {
    const trimmed = normalizeText(text);
    const arrayMatch = trimmed.match(/(\[\s*\{[\s\S]*\}\s*\])/);
    const objectMatch = trimmed.match(/(\{[\s\S]*\})/);
    if (arrayMatch) return arrayMatch[1];
    if (objectMatch) return objectMatch[1];
    return null;
  };

  const parseTestcases = (text) => {
    // First, try to extract an explicit JSON block from the text.
    const jsonBlock = extractJsonBlock(text);
    if (jsonBlock) {
      const parsed = JSON.parse(jsonBlock);
      if (!Array.isArray(parsed)) throw new Error('Expected an array of testcases.');
      return parsed.map((item, index) => ({
        id: item.id ?? `TC-${index + 1}`,
        title: item.title ?? item.name ?? `Testcase ${index + 1}`,
        preconditions: item.preconditions ?? item.precondition ?? '',
        steps: Array.isArray(item.steps) ? item.steps.join('\n') : item.steps ?? '',
        expected: item.expected ?? item.expected_result ?? '',
        priority: item.priority ?? 'Medium',
      }));
    }

    // Fallback parser: try to parse common plaintext formats produced by chat outputs.
    // Split input into blocks by occurrences of 'Test Case ID' (case-insensitive).
    const parts = text.split(/(?=Test\s*Case\s*ID\s*[:\-])/i).map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) {
      // As a final fallback, treat the whole input as a single testcase description.
      const single = parsePlainBlock(text, 0);
      if (!single) throw new Error('No JSON block found in the input.');
      return [single];
    }

    const results = parts.map((part, idx) => parsePlainBlock(part, idx));
    return results.filter(Boolean);
  };

  // Helper: parse a plaintext block into a testcase object using heuristics
  function parsePlainBlock(block, index) {
    const normalize = (s) => (s || '').replace(/\r\n/g, '\n').trim();
    const idMatch = block.match(/Test\s*Case\s*ID\s*[:\-]\s*([^\s\n]+)/i) || block.match(/ID\s*[:\-]\s*([^\n]+)/i);
    const titleMatch = block.match(/Title\s*[:\-]\s*([\s\S]*?)(?=\n\s*Preconditions\s*:|\n\s*Steps\s*:|\n\s*(?:Expected(?:\s*Result)?|Expected\s*Outcome)\s*:|$)/i);
    const preMatch = block.match(/Preconditions\s*[:\-]\s*([\s\S]*?)(?=\n\s*Steps\s*:|\n\s*(?:Expected(?:\s*Result)?|Expected\s*Outcome)\s*:|$)/i);
    const stepsMatch = block.match(/Steps\s*[:\-]\s*([\s\S]*?)(?=(?:\n|$)\s*(?:Expected(?:\s*Result)?|Expected\s*Outcome)\s*[:\-]|$)/i);
    const expectedMatch = block.match(/(?:Expected(?:\s*Result)?|Expected\s*Outcome)\s*[:\-]\s*([\s\S]*?)$/i);

    const id = idMatch ? normalize(idMatch[1]) : `TC-${index + 1}`;
    const title = titleMatch ? normalize(titleMatch[1]) : extractTitleFromBlock(block) || `Testcase ${index + 1}`;
    const preconditions = preMatch ? normalize(preMatch[1]) : '';
    let steps = stepsMatch ? normalize(stepsMatch[1]) : '';
    if (!steps) {
      // If no 'Steps:' label, try to capture the last paragraph as steps
      const afterTitle = block.replace(titleMatch ? titleMatch[0] : '', '');
      const maybeSteps = afterTitle.split(/\n\s*\n/).pop() || '';
      steps = normalize(maybeSteps);
    }
    const expected = expectedMatch ? normalize(expectedMatch[1]) : '';

    // Clean up common numbering prefixes in steps
    steps = steps.replace(/^\d+\.\s+/gm, '- ');
    // Split sentences into separate lines so Excel shows steps on new lines
    steps = steps.replace(/([\.\?!])\s+/g, '$1\n');
    // Trim extra whitespace around newlines
    steps = steps.split(/\n+/).map(s => s.trim()).filter(Boolean).join('\n');

    return {
      id,
      title,
      preconditions,
      steps,
      expected,
      priority: 'Medium',
    };
  }

  function extractTitleFromBlock(block) {
    // Try to find a short line near the start that looks like a title (not the id)
    const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return null;
    // prefer a line that starts with 'Title' already captured above; else take first long line up to 120 chars
    for (const line of lines) {
      if (/^Title\s*[:\-]/i.test(line)) continue;
      if (/^Test\s*Case\s*ID/i.test(line)) continue;
      if (line.length > 10 && line.length < 150) return line.replace(/^Title\s*[:\-]\s*/i, '').trim();
    }
    return lines[0];
  }

  const updateStatus = (message, isError = false) => {
    exportStatus.textContent = message;
    exportStatus.classList.toggle('error', isError);
  };

  scanChatBtn.addEventListener('click', () => {
    try {
      const text = rawJsonInput.value.trim();
      if (!text) {
        updateStatus('Paste your generated testcase JSON into the field and try again.', true);
        return;
      }
      parsedTestcases = parseTestcases(text);
      exportBtn.disabled = parsedTestcases.length === 0;
      updateStatus(`Detected ${parsedTestcases.length} testcase(s). Export is enabled.`);
    } catch (err) {
      updateStatus(err.message || 'Unable to parse JSON.', true);
    }
  });

  exportBtn.addEventListener('click', () => {
    if (!parsedTestcases.length) {
      updateStatus('No parsed testcases available. Scan the JSON first.', true);
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(parsedTestcases, {
      header: ['id', 'title', 'preconditions', 'steps', 'expected', 'priority'],
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Testcases');

    // Best-effort: enable text wrapping for Steps (D) and Expected (E) columns so
    // multiline content displays correctly in Excel. Some SheetJS builds ignore
    // cellStyles, but adding alignment is harmless and often respected by Excel.
    // Replace header row labels with Sentence case titles
    try {
      const headerLabels = ['Id', 'Title', 'Preconditions', 'Steps', 'Expected', 'Priority'];
      for (let c = 0; c < headerLabels.length; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (!worksheet[addr]) worksheet[addr] = { t: 's', v: headerLabels[c] };
        else worksheet[addr].v = headerLabels[c];
      }
    } catch (err) { /* ignore */ }

    try {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let R = range.s.r + 1; R <= range.e.r; ++R) { // skip header row
        const stepsAddr = XLSX.utils.encode_cell({ r: R, c: 3 });
        const expectedAddr = XLSX.utils.encode_cell({ r: R, c: 4 });
        if (worksheet[stepsAddr]) {
          worksheet[stepsAddr].v = String(worksheet[stepsAddr].v || '').replace(/\r/g, '');
          worksheet[stepsAddr].t = 's';
          worksheet[stepsAddr].s = worksheet[stepsAddr].s || {};
          worksheet[stepsAddr].s.alignment = Object.assign({}, worksheet[stepsAddr].s.alignment, { wrapText: true, vertical: 'top' });
        }
        if (worksheet[expectedAddr]) {
          worksheet[expectedAddr].v = String(worksheet[expectedAddr].v || '').replace(/\r/g, '');
          worksheet[expectedAddr].t = 's';
          worksheet[expectedAddr].s = worksheet[expectedAddr].s || {};
          worksheet[expectedAddr].s.alignment = Object.assign({}, worksheet[expectedAddr].s.alignment, { wrapText: true, vertical: 'top' });
        }
      }
    } catch (err) {
      // ignore styling errors
    }

    // Build a timestamped sentence-case filename, safe for filesystems
    const now = new Date();
    const ts = now.toISOString().slice(0,19).replace('T',' ').replace(/:/g,'-');
    const filename = `Testcases ${ts}.xlsx`;
    try {
      XLSX.writeFile(workbook, filename, { bookType: 'xlsx', cellStyles: true });
    } catch (e) {
      XLSX.writeFile(workbook, filename);
    }
    updateStatus('Excel exported successfully.');
  });
});
