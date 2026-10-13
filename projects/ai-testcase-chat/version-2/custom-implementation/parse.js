// Portable testcase parser used by browser UI and Node tests
(function(root){
  function parseTestcasesFromText(text){
    if(!text) return [];
    const trimmed = String(text).trim();
    if(trimmed.startsWith('{') || trimmed.startsWith('[')){
      try{
        const parsed = JSON.parse(trimmed);
        if(Array.isArray(parsed)){
          return parsed.map((o,i)=>({ id: o.id || o.tcId || o['TC ID'] || `TC-${i+1}`, desc: o.description || o.desc || '', steps: o.steps || '', expected: o.expected || o['Expected Result'] || '', priority: o.priority || '' }));
        }
        if(typeof parsed === 'object'){
          const arr = parsed.testcases || parsed.items || [];
          if(Array.isArray(arr)) return arr.map((o,i)=>({ id: o.id || `TC-${i+1}`, desc: o.description || '', steps: o.steps || '', expected: o.expected || '', priority: o.priority || '' }));
        }
      }catch(e){ }
    }

    const lines = String(text).split('\n').map(l=>l.trim()).filter(Boolean);
    const tableLines = lines.filter(l=>l.includes('|'));
    if(tableLines.length>=1){
      const rows=[];
      let start=0;
      if(tableLines.length>1 && tableLines[1].match(/^\s*[:\-\|\s]+$/)) start=2;
      for(let i=start;i<tableLines.length;i++){
        const parts = tableLines[i].split('|').map(p=>p.trim()).filter(Boolean).slice(0,5);
        if(parts.length>=1) rows.push({id:parts[0]||'', desc:parts[1]||'', steps:parts[2]||'', expected:parts[3]||'', priority:parts[4]||''});
      }
      if(rows.length) return rows;
    }

    const pipeLines = lines.filter(l=>l.split('|').length>=2);
    if(pipeLines.length){
      return pipeLines.map((l,i)=>{ const p=l.split('|').map(s=>s.trim()); return { id:p[0]||`TC-${i+1}`, desc:p[1]||'', steps:p[2]||'', expected:p[3]||'', priority:p[4]||'' }; });
    }

    return [{ id:'TC-1', desc:text, steps:'', expected:'', priority:'' }];
  }

  if(typeof module !== 'undefined' && module.exports) module.exports = { parseTestcasesFromText };
  else root.parseTestcasesFromText = parseTestcasesFromText;
})(this || window);
