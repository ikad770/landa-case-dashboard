// All Cases page rendering – uses helpers from app.js

function renderCases(){
  const list  = document.getElementById('casesList');
  const q     = (document.getElementById('searchBox').value || '').toLowerCase();
  const cases = getCases().filter(c=>{
    if(!q) return true;
    return (
      (c.issueSummary || '').toLowerCase().includes(q) ||
      (c.pressName     || '').toLowerCase().includes(q) ||
      (c.system        || '').toLowerCase().includes(q) ||
      (c.sfCase        || '').toLowerCase().includes(q)
    );
  });

  const badge=document.getElementById('casesCount');
  if(badge) badge.textContent = String(cases.length);

  if(!cases.length){
    list.innerHTML = '<div class="panel">No cases yet.</div>';
    return;
  }
  list.innerHTML = cases.map((c,i)=>caseCard(c,i)).join('');
}

function caseCard(c,i){
  const files = Array.isArray(c.attachments) && c.attachments.length
    ? `${c.attachments.length} file(s)`
    : 'No attachments';

  return `
  <div class="case-card">
    <div class="stripe"></div>
    <div>
      <div class="title">#${i+1} — ${esc(c.sfCase||'')}</div>
      <div class="meta">
        <span class="kv"><span class="k">Press:</span>
          <span class="v">${esc(c.pressName||'')} (${esc(c.pressType||'')})</span></span>
        <span class="kv"><span class="k">System:</span>
          <span class="v">${esc(c.system||'')} / ${esc(c.subSystem||'')}</span></span>
        <span class="kv"><span class="k">Category:</span>
          <span class="v">${esc(c.category||'')} → ${esc(c.item||'')}</span></span>
        <span class="kv"><span class="k">SW:</span>
          <span class="v">${esc(c.softwareVersion||'')}</span></span>
      </div>
      <div class="kv" style="margin-top:6px">
        <span class="k">Issue:</span>
        <span class="v">${esc(c.issueSummary||'')}</span>
      </div>
      <div class="files" style="margin-top:4px">${files}</div>
    </div>
    <div class="actions">
      <button class="btn small" onclick="openCase(${i})">Details</button>
      <button class="btn small danger" onclick="deleteCase(${i})">Delete</button>
    </div>
  </div>`;
}

function openCase(i){
  const arr = getCases();
  const c   = arr[i];
  if(!c) return;
  document.getElementById('modalTitle').textContent =
    `Case #${i+1} — ${c.sfCase || ''}`;

  const files = Array.isArray(c.attachments) && c.attachments.length
    ? c.attachments.map(a=>`
        <div class="kv">
          <span class="k">•</span>
          <a class="btn small" href="${a.data}" target="_blank" rel="noopener">View</a>
          <a class="btn small" href="${a.data}" download="${esc(a.name)}">Download</a>
          <span class="v">${esc(a.name)}</span>
        </div>`).join('')
    : '<div class="attach-empty">No attachments</div>';

  document.getElementById('modalBody').innerHTML = `
    <div class="grid cols-2">
      <div class="panel">
        <div class="kv"><span class="k">Press:</span>
          <span class="v">${esc(c.pressName||'')} (${esc(c.pressType||'')})</span></div>
        <div class="kv"><span class="k">System:</span>
          <span class="v">${esc(c.system||'')} / ${esc(c.subSystem||'')}</span></div>
        <div class="kv"><span class="k">Category:</span>
          <span class="v">${esc(c.category||'')} → ${esc(c.item||'')}</span></div>
        <div class="kv"><span class="k">Software:</span>
          <span class="v">${esc(c.softwareVersion||'')}</span></div>
        <div class="kv"><span class="k">TFS:</span>
          <span class="v">${esc(c.tfsNumber||'')}</span></div>
      </div>
      <div class="panel">
        <div class="kv"><span class="k">Opened:</span>
          <span class="v">${new Date(c.createdAt).toLocaleString()}</span></div>
        <div class="kv"><span class="k">Author:</span>
          <span class="v">${esc(c.author||'')}</span></div>
      </div>
    </div>

    <div class="panel" style="margin-top:12px"><h3>Problem</h3>
      <div class="kv"><span class="k">Summary:</span>
        <span class="v">${esc(c.issueSummary||'')}</span></div>
      <div class="kv"><span class="k">Symptoms:</span>
        <span class="v">${nl(esc(c.symptoms||''))}</span></div>
    </div>

    <div class="panel" style="margin-top:12px"><h3>Solution</h3>
      <div class="kv"><span class="k">Troubleshooting:</span>
        <span class="v">${nl(esc(c.troubleshooting||''))}</span></div>
      <div class="kv"><span class="k">Part issue:</span>
        <span class="v">${esc(c.partCatalog||'')}</span></div>
      <div class="kv"><span class="k">Implemented:</span>
        <span class="v">${nl(esc(c.solution||''))}</span></div>
      <div class="kv"><span class="k">SW-dependent:</span>
        <span class="v">${c.solutionVersionDependent ? 'Yes' : 'No'}</span></div>
      ${c.solutionVersionDependent ? `
        <div class="kv"><span class="k">Affected versions:</span>
          <span class="v">${esc(c.solutionVersions||'')}</span></div>` : ''}
      <div class="kv"><span class="k">Verification:</span>
        <span class="v">${esc(c.verification||'')}</span></div>
      <div class="kv"><span class="k">Notes:</span>
        <span class="v">${nl(esc(c.notes||''))}</span></div>
      <div class="kv" style="margin-top:12px"><span class="k">Files:</span>
        <span class="v">${files}</span></div>
    </div>`;
  openModal();
}

function deleteCase(i){
  const arr = getCases();
  if(!arr[i]) return;
  if(!confirm('Delete this case?')) return;
  arr.splice(i,1);
  setCases(arr);
  renderCases();
  toast('Case deleted','ok');
}

// expose
window.renderCases = renderCases;
window.openCase    = openCase;
window.deleteCase  = deleteCase;
