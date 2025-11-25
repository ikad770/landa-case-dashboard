// cases.js – storage, listing, dashboard stats

const LS_KEY = 'landa_cases_v19';

// basic storage
function getCases() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}
function setCases(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

// helpers
function esc(s) {
  return (s || '').replace(/[&<>"]/g, c => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]
  ));
}
function nl(s) {
  return String(s || '').replace(/\n/g,'<br>');
}

// ===== Cases render =====
function caseCard(c, i) {
  const files = Array.isArray(c.attachments) && c.attachments.length
    ? `${c.attachments.length} file(s)`
    : 'No attachments';

  return `
  <div class="case-card">
    <div class="stripe"></div>
    <div>
      <div class="title">#${i+1} — ${esc(c.sfCase || '')}</div>
      <div class="meta">
        <span class="kv"><span class="k">Press:</span><span class="v">${esc(c.pressName || '')} (${esc(c.pressType || '')})</span></span>
        <span class="kv"><span class="k">System:</span><span class="v">${esc(c.system || '')} / ${esc(c.subSystem || '')}</span></span>
        <span class="kv"><span class="k">Category:</span><span class="v">${esc(c.category || '')} → ${esc(c.item || '')}</span></span>
        <span class="kv"><span class="k">SW:</span><span class="v">${esc(c.softwareVersion || '')}</span></span>
      </div>
      <div class="kv" style="margin-top:6px">
        <span class="k">Issue:</span><span class="v">${esc(c.issueSummary || '')}</span>
      </div>
      <div class="files">${files}</div>
    </div>
    <div class="actions inline">
      <button class="btn small" onclick="openCase(${i})">Details</button>
      <button class="btn small danger" onclick="deleteCase(${i})">Delete</button>
    </div>
  </div>`;
}

function renderCases() {
  const list = document.getElementById('casesList');
  if (!list) return;

  const q = (document.getElementById('searchBox')?.value || '').toLowerCase();
  const arr = getCases().filter(c => {
    if (!q) return true;
    return (
      (c.issueSummary || '').toLowerCase().includes(q) ||
      (c.pressName || '').toLowerCase().includes(q) ||
      (c.system || '').toLowerCase().includes(q)
    );
  });

  const badge = document.getElementById('casesCount');
  if (badge) badge.textContent = String(arr.length);

  if (!arr.length) {
    list.innerHTML = `<div class="panel">No cases yet.</div>`;
    return;
  }
  list.innerHTML = arr.map((c,i)=>caseCard(c,i)).join('');
}

function openCase(i) {
  const arr = getCases();
  const c = arr[i];
  if (!c) return;

  const modalBack = document.getElementById('modalBack');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  if (!modalBack || !modalBody || !modalTitle) return;

  modalTitle.textContent = `Case #${i+1} — ${c.sfCase || ''}`;

  const filesHTML = Array.isArray(c.attachments) && c.attachments.length
    ? c.attachments.map(a => `
      <div class="kv">
        <span class="k">•</span>
        <a class="btn small" href="${a.data}" target="_blank" rel="noopener">View</a>
        <a class="btn small" href="${a.data}" download="${esc(a.name)}">Download</a>
        <span class="v">${esc(a.name)}</span>
      </div>`).join('')
    : '<div class="files">No attachments</div>';

  modalBody.innerHTML = `
    <div class="grid cols-2">
      <div class="panel">
        <div class="kv"><span class="k">Press:</span><span class="v">${esc(c.pressName || '')} (${esc(c.pressType || '')})</span></div>
        <div class="kv"><span class="k">System:</span><span class="v">${esc(c.system || '')} / ${esc(c.subSystem || '')}</span></div>
        <div class="kv"><span class="k">Category:</span><span class="v">${esc(c.category || '')} → ${esc(c.item || '')}</span></div>
        <div class="kv"><span class="k">Software:</span><span class="v">${esc(c.softwareVersion || '')}</span></div>
        <div class="kv"><span class="k">TFS:</span><span class="v">${esc(c.tfsNumber || '')}</span></div>
      </div>
      <div class="panel">
        <div class="kv"><span class="k">Opened:</span><span class="v">${c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span></div>
      </div>
    </div>

    <div class="panel" style="margin-top:12px">
      <h3>Problem</h3>
      <div class="kv"><span class="k">Summary:</span><span class="v">${esc(c.issueSummary || '')}</span></div>
      <div class="kv"><span class="k">Symptoms:</span><span class="v">${nl(esc(c.symptoms || ''))}</span></div>
    </div>

    <div class="panel" style="margin-top:12px">
      <h3>Solution</h3>
      <div class="kv"><span class="k">Troubleshooting:</span><span class="v">${nl(esc(c.troubleshooting || ''))}</span></div>
      <div class="kv"><span class="k">Part issue:</span><span class="v">${esc(c.partIssue || '')}</span></div>
      <div class="kv"><span class="k">Final solution:</span><span class="v">${nl(esc(c.solution || ''))}</span></div>
      <div class="kv"><span class="k">SW-dependent:</span><span class="v">${c.solutionSWDependent ? 'Yes' : 'No'}</span></div>
      <div class="kv"><span class="k">Affected versions:</span><span class="v">${esc(c.solutionSWVersions || '')}</span></div>
      <div class="kv"><span class="k">Verification:</span><span class="v">${esc(c.verification || '')}</span></div>
      <div class="kv"><span class="k">Notes:</span><span class="v">${nl(esc(c.notes || ''))}</span></div>
      <div class="kv" style="margin-top:8px">
        <span class="k">Files:</span><span class="v">${filesHTML}</span>
      </div>
    </div>
  `;

  modalBack.style.display = 'flex';
}

function closeModal() {
  const modalBack = document.getElementById('modalBack');
  if (modalBack) modalBack.style.display = 'none';
}
window.closeModal = closeModal;

function deleteCase(i) {
  const arr = getCases();
  if (!arr[i]) return;
  if (!confirm('Delete this case?')) return;
  arr.splice(i, 1);
  setCases(arr);
  renderCases();
  if (typeof updateKPIsFromCases === 'function') updateKPIsFromCases();
  if (typeof toast === 'function') toast('Case deleted','ok');
}

function exportCSV() {
  const arr = getCases();
  if (!arr.length) {
    if (typeof toast === 'function') toast('No cases to export','err');
    return;
  }
  const cols = [
    'sfCase','pressType','pressName','softwareVersion','tfsNumber',
    'system','subSystem','category','item',
    'issueSummary','symptoms','troubleshooting','partIssue',
    'solution','solutionSWDependent','solutionSWVersions',
    'verification','notes','attachments','createdAt'
  ];
  const header = cols.join(',');
  const rows = arr.map(o => cols.map(k => {
    let v = o[k];
    if (Array.isArray(v)) v = `${v.length} file(s)`;
    if (v == null) v = '';
    return JSON.stringify(String(v).replace(/\n/g,' '));
  }).join(','));
  const csv = [header].concat(rows).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'landa_cases.csv';
  a.click();
}

// ===== Dashboard stats =====
function updateKPIsFromCases() {
  const arr = getCases();
  const total = arr.length;

  const kpiTotal = document.getElementById('kpiTotal');
  const kpiUpdated = document.getElementById('kpiUpdated');
  const kpiPresses = document.getElementById('kpiPresses');
  const kpiSW = document.getElementById('kpiSW');

  if (kpiTotal) kpiTotal.textContent = String(total);
  let last = '—';
  if (total && arr[total-1].createdAt) {
    last = new Date(arr[total-1].createdAt).toLocaleString();
  }
  if (kpiUpdated) kpiUpdated.textContent = last;

  const presses = new Set(arr.map(c=>c.pressName).filter(Boolean));
  const sws     = new Set(arr.map(c=>c.softwareVersion).filter(Boolean));

  if (kpiPresses) kpiPresses.textContent = String(presses.size);
  if (kpiSW)      kpiSW.textContent      = String(sws.size);

  // distributions
  const byCustomerEl = document.getElementById('dashByCustomer');
  const bySystemEl   = document.getElementById('dashBySystem');
  const bySWEl       = document.getElementById('dashBySW');

  const agg = (keyFn) => {
    const map = new Map();
    for (const c of arr) {
      const k = keyFn(c) || '—';
      map.set(k, (map.get(k) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,8);
  };

  const byCustomer = agg(c => (c.pressName || '').split(' – ')[1] || c.pressName);
  const bySystem   = agg(c => c.system);
  const bySW       = agg(c => c.softwareVersion);

  const toHTML = (pairs) => pairs.map(([k,v]) => `
    <div class="mini-row">
      <span class="mini-label">${esc(k)}</span>
      <span class="mini-value">${v}</span>
    </div>`).join('') || '<div class="mini-label">No data yet</div>';

  if (byCustomerEl) byCustomerEl.innerHTML = toHTML(byCustomer);
  if (bySystemEl)   bySystemEl.innerHTML   = toHTML(bySystem);
  if (bySWEl)       bySWEl.innerHTML       = toHTML(bySW);
}

// expose
window.getCases = getCases;
window.setCases = setCases;
window.renderCases = renderCases;
window.exportCSV = exportCSV;
window.openCase = openCase;
window.deleteCase = deleteCase;
window.updateKPIsFromCases = updateKPIsFromCases;
