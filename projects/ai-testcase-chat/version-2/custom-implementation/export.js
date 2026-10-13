/* Simple CSV export utility. Produces a CSV file Excel can open. */
window.exportToCsv = function(rows){
  const headers = ['TC ID','Description','Steps','Expected Result','Priority'];
  const esc = v => '"' + String(v||'').replace(/"/g,'""') + '"';
  const lines = [headers.map(esc).join(',')];
  rows.forEach(r=>{
    lines.push([r.id||'', r.desc||'', r.steps||'', r.expected||'', r.priority||''].map(esc).join(','));
  });
  const csv = lines.join('\r\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'testcases.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

window.exportToXlsx = async function(rows){
  if(!rows || !rows.length) return;
  // load SheetJS if not present
  if(typeof window.XLSX === 'undefined'){
    try{
      await new Promise((resolve,reject)=>{
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/xlsx/dist/xlsx.full.min.js';
        s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
      });
    }catch(e){
      // fallback to CSV
      console.warn('SheetJS load failed, falling back to CSV', e);
      return window.exportToCsv(rows);
    }
  }

  try{
    const data = rows.map(r=>({ 'TC ID': r.id||'', 'Description': r.desc||'', 'Steps': r.steps||'', 'Expected Result': r.expected||'', 'Priority': r.priority||'' }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Testcases');
    const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
    const blob = new Blob([wbout], {type:'application/octet-stream'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'testcases.xlsx'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }catch(e){
    console.error('XLSX export failed, falling back to CSV', e);
    window.exportToCsv(rows);
  }
}
