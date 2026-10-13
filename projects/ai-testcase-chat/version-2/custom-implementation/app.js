// Basic UI wiring and API call logic
(function(){
  const chatEl = document.getElementById('chat');
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const clearBtn = document.getElementById('clearBtn');
  const copyBtn = document.getElementById('copyBtn');
  const exportBtn = document.getElementById('exportBtn');
  const errorEl = document.getElementById('error');
  const themeSwitch = document.getElementById('themeSwitch');

  const samples = document.querySelectorAll('.sample-btn');
  samples.forEach(s=>s.addEventListener('click',()=>{input.value=s.dataset.sample;}));

  function showError(msg){ errorEl.textContent = msg; }
  function clearError(){ errorEl.textContent = ''; }

  function appendMessage(text, cls='bot'){ const d=document.createElement('div'); d.className=`message ${cls}`; d.textContent=text; chatEl.appendChild(d); chatEl.scrollTop = chatEl.scrollHeight; }

  clearBtn.addEventListener('click', ()=>{ chatEl.innerHTML=''; appendMessage('Happy to help you in Testcase generation','bot welcome'); });
  copyBtn.addEventListener('click', async ()=>{
    const msgs = chatEl.querySelectorAll('.message');
    if(!msgs.length) return showError('No message to copy');
    const last = msgs[msgs.length-1].textContent;
    try{ await navigator.clipboard.writeText(last); clearError(); }catch(e){ showError('Clipboard not available'); }
  });

  // Theme
  themeSwitch.addEventListener('change', e=>{
    document.body.className = e.target.checked ? 'dark' : 'light';
  });

  function genSessionId(){ return 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2,9); }

  async function sendMessage(){
    clearError();
    const text = input.value.trim();
    if(!text) return showError('Please enter a message');
    appendMessage(text,'user');
    appendMessage('Siri is typing...','bot');

    if(!window.CONFIG){ showError('Missing configuration. Copy config.example.js to config.js and set values.'); return; }

    const endpoint = (window.CONFIG.BASE_URL || '').replace(/\/+$/,'') + '/' + (window.CONFIG.FLOW_ID || '');
    const payload = {
      output_type: 'chat',
      input_type: 'chat',
      input_value: text,
      tweaks: {
        ['GroqModel-jKsdU']: { model_name: window.CONFIG.MODEL_NAME }
      },
      session_id: genSessionId()
    };

    try{
      const baseHeaderName = window.CONFIG.AUTH_HEADER || 'Authorization';
      const baseScheme = (typeof window.CONFIG.AUTH_SCHEME !== 'undefined') ? window.CONFIG.AUTH_SCHEME : 'Bearer ';

      const makeHeaders = (headerName, scheme) => {
        const h = {'Content-Type':'application/json'};
        if(window.CONFIG.API_KEY && headerName){
          const value = (scheme ? String(scheme) : '') + String(window.CONFIG.API_KEY);
          h[headerName] = value;
        }
        return h;
      };

      async function tryFetchWithFallback(primaryName, primaryScheme){
        const primaryHeaders = makeHeaders(primaryName, primaryScheme);
        let res = await fetch(endpoint, { method:'POST', headers: primaryHeaders, body: JSON.stringify(payload) });
        if(res.ok) return res;

        // If 403, try an alternate header/scheme once
        if(res.status === 403 && window.CONFIG.API_KEY){
          // decide alternate: if primary isn't x-api-key, try x-api-key with no scheme; else try Authorization: Bearer
          const altName = (String(primaryName).toLowerCase() !== 'x-api-key') ? 'x-api-key' : 'Authorization';
          const altScheme = (String(altName).toLowerCase() === 'x-api-key') ? '' : 'Bearer ';
          appendMessage(`Retrying with ${altName}`,'bot');
          const altHeaders = makeHeaders(altName, altScheme);
          const altRes = await fetch(endpoint, { method:'POST', headers: altHeaders, body: JSON.stringify(payload) });
          return altRes;
        }
        return res;
      }

      const res = await tryFetchWithFallback(baseHeaderName, baseScheme);
      if(!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      // remove the 'Siri is typing...' placeholder
      const typing = Array.from(chatEl.querySelectorAll('.message.bot')).find(n=>n.textContent.includes('Siri is typing'));
      if(typing) typing.remove();

      // Extract textual output from the response in a few common shapes
      function extractText(payload){
        if(!payload) return '';
        if(typeof payload === 'string') return payload;
        if(Array.isArray(payload)) return payload.map(p=>extractText(p)).join('\n');

        // If object, try to find common text containers or any nested 'text' fields
        const candidates = [];

        function walk(obj){
          if(!obj) return;
          if(typeof obj === 'string') { candidates.push(obj); return; }
          if(Array.isArray(obj)){ obj.forEach(walk); return; }
          if(typeof obj === 'object'){
            for(const k of Object.keys(obj)){
              try{
                const v = obj[k];
                if(k.toLowerCase().includes('text') && typeof v === 'string') candidates.push(v);
                else if(k.toLowerCase().includes('message') && typeof v === 'string') candidates.push(v);
                else walk(v);
              }catch(e){ /* ignore */ }
            }
          }
        }

        // Look for common top-level keys first
        if(payload.output && typeof payload.output === 'string') candidates.push(payload.output);
        if(payload.result && typeof payload.result === 'string') candidates.push(payload.result);
        if(payload.outputs && Array.isArray(payload.outputs)) payload.outputs.forEach(o=>walk(o));

        walk(payload);

        if(candidates.length) return candidates.join('\n\n');

        // fallback to stringified JSON
        try{ return JSON.stringify(payload); }catch(e){ return String(payload); }
      }

      const out = extractText(data);
      // Try to parse testcases from the textual output
      let rows = [];
      try{ rows = parseTestcasesFromText(out) || []; }catch(e){ rows = []; }

      function looksStructured(rows, original){
        if(!rows || !rows.length) return false;
        if(rows.length>1) return true;
        const first = rows[0];
        if(!first) return false;
        const id = String(first.id || '');
        if(id.toLowerCase().startsWith('tc') || /tc[_\-]?\w+/i.test(id)) return true;
        if(original){
          const o = String(original);
          if(o.includes('|')) return true;
          if(/\bTest\s*Case\b/i.test(o)) return true;
          if(/\bTC[_\-]?\w+\b/i.test(o)) return true;
        }
        // if the parsed description is much shorter than original, likely parsed
        if(first.desc && original && first.desc.length < original.length/2) return true;
        return false;
      }

      if(looksStructured(rows, out)){
        // store for export
        window.LAST_TESTCASES = rows;
        // format user-friendly lines: one testcase per paragraph
        const lines = rows.map((r,i)=>{
          const id = r.id || `TC-${i+1}`;
          const parts = [`${id}: ${r.desc || ''}`];
          if(r.steps) parts.push(`Steps: ${r.steps}`);
          if(r.expected) parts.push(`Expected: ${r.expected}`);
          if(r.priority) parts.push(`Priority: ${r.priority}`);
          return parts.join(' | ');
        });
        appendMessage(lines.join('\n\n'),'bot');
      }else{
        // No structured testcases found — present a concise reply
        appendMessage('No structured testcases found in the response.','bot');
        // still log full raw output for debugging and allow export fallback
        console.debug('Raw response:', out);
      }

      input.value = '';
      clearError();
    }catch(err){
      showError(err.message || 'Error sending message');
      // remove typing placeholder
      const typing = Array.from(chatEl.querySelectorAll('.message.bot')).find(n=>n.textContent.includes('Siri is typing'));
      if(typing) typing.remove();
      appendMessage('Error: ' + (err.message||''),'bot');
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter'){ sendMessage(); } });

  exportBtn.addEventListener('click', ()=>{
    // Prefer last parsed testcases, fallback to parsing visible bot messages
    let rows = window.LAST_TESTCASES && window.LAST_TESTCASES.length ? window.LAST_TESTCASES.slice() : null;
    if(!rows){
      const botMsgs = Array.from(chatEl.querySelectorAll('.message.bot')).map(n=>n.textContent).filter(t=>t && !t.includes('typing'));
      if(!botMsgs.length) return showError('No generated testcases to export');
      rows = [];
      botMsgs.forEach(m=>{
        const parsed = parseTestcasesFromText(m);
        if(parsed && parsed.length) rows.push(...parsed);
      });
    }

    if(!rows || !rows.length) return showError('No testcases found to export');
    // try XLSX export first, else CSV
    if(window.exportToXlsx){ window.exportToXlsx(rows); }
    else if(window.exportToCsv){ window.exportToCsv(rows); }
    else showError('No export method available');
  });

  // Parser: extract testcase rows from plain text or markdown-like table
  function parseTestcasesFromText(text){
    if(!text) return [];
    // Try JSON
    const trimmed = text.trim();
    if(trimmed.startsWith('{') || trimmed.startsWith('[')){
      try{
        const parsed = JSON.parse(trimmed);
        if(Array.isArray(parsed)){
          // map objects with common keys
          return parsed.map((o,i)=>({ id: o.id || o.tcId || o['TC ID'] || `TC-${i+1}`, desc: o.description || o.desc || '', steps: o.steps || '', expected: o.expected || o['Expected Result'] || '', priority: o.priority || '' }));
        }
        if(typeof parsed === 'object'){
          const arr = parsed.testcases || parsed.items || [];
          if(Array.isArray(arr)) return arr.map((o,i)=>({ id: o.id || `TC-${i+1}`, desc: o.description || '', steps: o.steps || '', expected: o.expected || '', priority: o.priority || '' }));
        }
      }catch(e){ /* not json */ }
    }

    const lines = text.split('\n').map(l=>l.trim()).filter(Boolean);
    // detect markdown/table rows with |
    const tableLines = lines.filter(l=>l.includes('|'));
    if(tableLines.length>=1){
      // remove header/separator if present
      const rows = [];
      // if first line looks like header with TC ID, skip header
      let start = 0;
      if(tableLines.length>1 && tableLines[1].match(/^\s*[:\-\|\s]+$/)) start = 2;
      for(let i=start;i<tableLines.length;i++){
        const parts = tableLines[i].split('|').map(p=>p.trim()).filter(Boolean).slice(0,5); // first 5 columns
        if(parts.length>=1){ rows.push({id: parts[0]||'', desc: parts[1]||'', steps: parts[2]||'', expected: parts[3]||'', priority: parts[4]||''}); }
      }
      if(rows.length) return rows;
    }

    // detect lines that appear as TCID|Description|... simple split
    const pipeLines = lines.filter(l=>l.split('|').length>=2);
    if(pipeLines.length){
      return pipeLines.map((l,i)=>{ const p=l.split('|').map(s=>s.trim()); return { id:p[0]||`TC-${i+1}`, desc:p[1]||'', steps:p[2]||'', expected:p[3]||'', priority:p[4]||'' }; });
    }

    // fallback: single row using entire text as description
    return [{ id:'TC-1', desc:text, steps:'', expected:'', priority:'' }];
  }

})();
