/* ======================================================
   Landa Quantum – Troubleshoot Suite (V13+)
   Refined Logic Engine
   ====================================================== */

/* ===== Particles Animation ===== */
(function(){
  const wrap = document.getElementById('particles');
  if(!wrap) return;
  for(let i=0; i<40; i++){
    const d = document.createElement('div');
    d.className = 'particle';
    d.style.left = Math.random()*100 + '%';
    d.style.top = (60 + Math.random()*60) + '%';
    d.style.animationDuration = (12 + Math.random()*10) + 's';
    d.style.opacity = 0.35 + Math.random()*0.35;
    wrap.appendChild(d);
  }
})();

/* ===== LOGIN ===== */
const loginScreen = document.getElementById('loginScreen');
const appRoot = document.getElementById('appRoot');
const userField = document.getElementById('authUser');
const passField = document.getElementById('authPass');
const btnFill = document.getElementById('btnFill');
const btnLogin = document.getElementById('btnLogin');

btnFill.onclick = () => {
  userField.value = 'Expert';
  passField.value = 'Landa123456';
};

btnLogin.onclick = () => {
  const user = userField.value.trim();
  const pass = passField.value.trim();
  if (user === 'Expert' && pass === 'Landa123456') {
    loginScreen.classList.add('hidden');
    appRoot.classList.remove('hidden');
    toast('Welcome, Expert', 'ok');
    go('dashboard');
    updateKPIs();
  } else {
    toast('Invalid credentials', 'err');
  }
};

/* ===== NAVIGATION ===== */
const pages = ['dashboard', 'create', 'cases'];
document.querySelectorAll('.nav .item').forEach(btn => {
  btn.onclick = e => {
    e.preventDefault();
    const route = btn.dataset.route;
    go(route);
  };
});

function go(route) {
  pages.forEach(p => document.getElementById('page-' + p).classList.add('hidden'));
  document.getElementById('page-' + route).classList.remove('hidden');
  document.querySelectorAll('.nav .item').forEach(a =>
    a.classList.toggle('active', a.dataset.route === route)
  );
  if (route === 'dashboard') updateKPIs();
  if (route === 'cases') renderCases();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.getElementById('goHome').onclick = () => go('dashboard');

/* ===== LOCAL STORAGE ===== */
const LS_KEY = 'landa_cases_v13_plus';
function getCases() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch (e) { return []; }
}
function setCases(a) {
  localStorage.setItem(LS_KEY, JSON.stringify(a));
  updateKPIs();
}

/* ===== MACHINE, SYSTEM, SUBSYSTEM ===== */
const MACHINES = {
  Simplex: ['S2','S3','S5','S7'],
  Duplex: ['D3','D5','D7','D9']
};
const SYSTEMS = [
  'BSS','STS','IPS','BCU','IRD','Hot Air','PSS','CWS','Ventilation',
  'MSPS','ITS','EC','DFE','PQ','QCS','PC Cabinet','ICS'
];
const SUBSETS = {
  'BSS': ['Sensors','Interface','Controller','Transport','Software','Power']
};

const sysSel = document.getElementById('system');
const subSel = document.getElementById('subSystem');
function populateSystems(){
  sysSel.innerHTML = '';
  SYSTEMS.forEach(s => {
    const o = document.createElement('option');
    o.textContent = s;
    sysSel.appendChild(o);
  });
}
sysSel.addEventListener('change', () => {
  const list = SUBSETS[sysSel.value] || ['General','Sensors','Controller','Power','Cooling','Software'];
  subSel.innerHTML = '';
  list.forEach(s => {
    const o = document.createElement('option');
    o.textContent = s;
    subSel.appendChild(o);
  });
});

/* ===== MACHINE TYPE TOGGLE ===== */
const typeToggle = document.getElementById('typeToggle');
const hiddenType = document.getElementById('machineType');
const numSel = document.getElementById('machineNumber');
typeToggle.querySelectorAll('.tbtn').forEach(btn => {
  btn.onclick = () => {
    typeToggle.querySelectorAll('.tbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    hiddenType.value = btn.dataset.type;
    loadMachines();
  };
});
function loadMachines() {
  numSel.innerHTML = '';
  (MACHINES[hiddenType.value] || []).forEach(n => {
    const o = document.createElement('option');
    o.textContent = n;
    numSel.appendChild(o);
  });
}

/* ===== TROUBLESHOOTING STEPS ===== */
function addTS(val='') {
  const row = document.createElement('div');
  row.className = 'inline';
  row.style.marginBottom = '6px';
  const i = document.createElement('input');
  i.className = 'input';
  i.placeholder = 'Step...';
  i.value = val;
  const rm = document.createElement('button');
  rm.className = 'btn small danger';
  rm.type = 'button';
  rm.textContent = 'Remove';
  rm.onclick = () => row.remove();
  row.appendChild(i);
  row.appendChild(rm);
  document.getElementById('tsList').appendChild(row);
}
addTS();

/* ===== FILE UPLOADS ===== */
function addFileRow() {
  const wrap = document.getElementById('filesWrap');
  const row = document.createElement('div');
  row.className = 'inline';
  row.style.marginBottom = '6px';
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.className = 'input';
  inp.accept = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip";
  const rm = document.createElement('button');
  rm.className = 'btn small danger';
  rm.type = 'button';
  rm.textContent = 'Remove';
  rm.onclick = () => row.remove();
  row.appendChild(inp);
  row.appendChild(rm);
  wrap.appendChild(row);
}
addFileRow();

/* ===== SAVE CASE ===== */
function saveCase(e) {
  e.preventDefault();
  const req = v => v && v.trim().length > 0;
  const tsSteps = Array.from(document.querySelectorAll('#tsList .input')).map(i => i.value).filter(Boolean);
  const data = {
    sfCase: sfCase.value,
    tfs: tfsNumber.value,
    machineType: machineType.value,
    machineNumber: machineNumber.value,
    system: system.value,
    subSystem: subSystem.value,
    issueSummary: issueSummary.value,
    symptoms: symptoms.value,
    troubleshooting: tsSteps,
    parts: parts.value,
    solution: solution.value,
    verification: verification.value,
    created: new Date().toLocaleString(),
    author: 'Expert'
  };
  const errors = ['sfCase','machineNumber','system','issueSummary','solution'].filter(id => {
    const v = document.getElementById(id)?.value || '';
    return !req(v);
  });
  if (errors.length) {
    toast('Fill required: ' + errors.join(', '), 'err');
    return;
  }
  const arr = getCases();
  arr.push(data);
  setCases(arr);
  toast('Case saved', 'ok');
  renderCases();
  go('cases');
}

/* ===== RENDER CASES ===== */
function renderCases() {
  const arr = getCases();
  document.getElementById('casesCount').textContent = arr.length;
  const list = document.getElementById('casesList');
  if (!arr.length) {
    list.innerHTML = '<div class="panel glass">No cases yet.</div>';
    return;
  }
  list.innerHTML = arr.map((c,i) => `
    <div class="case-card glass fade-in">
      <div class="stripe"></div>
      <div>
        <div class="title">#${i+1} – ${c.sfCase}</div>
        <div class="help">${c.machineNumber} (${c.machineType}) • ${c.system}</div>
        <div class="help" style="margin-top:4px">${c.issueSummary}</div>
      </div>
      <div><button class="btn small" onclick="viewCase(${i})">View</button></div>
    </div>`).join('');
}

/* ===== VIEW CASE MODAL ===== */
function viewCase(i) {
  const c = getCases()[i];
  if (!c) return;
  const body = `
  <div class="panel glass">
    <h3>${c.sfCase}</h3>
    <div><b>Machine:</b> ${c.machineNumber} (${c.machineType})</div>
    <div><b>System:</b> ${c.system}</div>
    <div><b>Issue:</b> ${c.issueSummary}</div>
    <div><b>Solution:</b> ${c.solution}</div>
    <div><b>Verification:</b> ${c.verification}</div>
    <div><b>Created:</b> ${c.created}</div>
  </div>`;
  document.getElementById('modalTitle').textContent = `Case #${i+1}`;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalBack').style.display = 'flex';
}
function closeModal(){ document.getElementById('modalBack').style.display='none'; }

/* ===== TOAST ===== */
function toast(msg, type='ok') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

/* ===== KPI UPDATE ===== */
function updateKPIs() {
  const a = getCases();
  kpiTotal.textContent = a.length;
  kpiFiles.textContent = a.filter(x => x.parts).length;
  kpiUpdated.textContent = a.length ? a[a.length-1].created : '—';
}

/* ===== EXPORT CSV ===== */
function exportCSV() {
  const a = getCases();
  if (!a.length) { toast('No data to export', 'err'); return; }
  const cols = Object.keys(a[0] || {});
  const csv = [cols.join(',')].concat(a.map(o => cols.map(k => JSON.stringify(o[k] || '')).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const aEl = document.createElement('a');
  aEl.href = url;
  aEl.download = 'landa_cases.csv';
  aEl.click();
  URL.revokeObjectURL(url);
}

/* ===== INIT ===== */
(function init() {
  populateSystems();
  loadMachines();
})();
