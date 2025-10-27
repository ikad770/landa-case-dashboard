/* ===== Particles on Login ===== */
(function(){
  const wrap = document.getElementById('particles');
  for(let i=0;i<40;i++){
    const d = document.createElement('div'); d.className = 'particle';
    d.style.left = Math.random()*100 + '%';
    d.style.top  = (60 + Math.random()*60) + '%';
    d.style.animationDuration = (12 + Math.random()*12) + 's';
    d.style.opacity = .35 + Math.random()*.35;
    wrap.appendChild(d);
  }
})();

/* ===== Auth ===== */
const loginScreen = document.getElementById('loginScreen');
const appRoot     = document.getElementById('appRoot');
document.getElementById('btnFill').onclick = ()=>{ authUser.value='Expert'; authPass.value='Landa123456'; };
document.getElementById('btnLogin').onclick = ()=>{
  const u=authUser.value.trim(), p=authPass.value;
  if(u==='Expert' && p==='Landa123456'){
    loginScreen.classList.add('hidden'); appRoot.classList.remove('hidden');
    toast('Welcome, Expert','ok'); go('create'); updateKPIs();
  } else toast('Invalid credentials','err');
};

/* ===== Router ===== */
const pages=['dashboard','create','cases','settings'];
function go(route){
  pages.forEach(p=> document.getElementById('page-'+p).classList.add('hidden'));
  document.getElementById('page-'+route).classList.remove('hidden');
  document.querySelectorAll('.nav .item').forEach(a=> a.classList.toggle('active', a.dataset.route===route));
  if(route==='dashboard') updateKPIs();
  if(route==='cases') renderCases();
  window.scrollTo({top:0, behavior:'smooth'});
}
document.getElementById('goHome').onclick = ()=> go('dashboard');

/* ===== Data / Storage ===== */
const LS_KEY='landa_cases_v13_2';
function getCases(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); } catch(e){ return [] } }
function setCases(a){ localStorage.setItem(LS_KEY, JSON.stringify(a)); updateKPIs(); }

/* ===== Lists (Machines / Systems) ===== */
const MACHINES={ Simplex:['S2','S3','S5','S7'], Duplex:['D3','D5','D7','D9'] };
const SYSTEMS=[
  'BSS','STS','IPS','BCU','IRD','Hot Air','PSS','CWS','Ventilation','MSPS','ITS','EC','DFE','PQ','QCS','PC Cabinet','ICS'
];
const SUBSETS={
  'BSS':['Sensors','Interface','Controller','Transport','Software','Power'],
  'STS':['Drives','Sensors','Cooling','Control'],
  'IPS':['Control Board','Power','Process'],
  'BCU':['Controller','I/O','Power'],
  'IRD':['Heaters','Sensors','Control'],
  'Hot Air':['Fans','Heaters','Ducts'],
  'PSS':['Paper Path','Cutter','Roll'],
  'CWS':['Chiller','Pumps','Control'],
  'Ventilation':['Fans','Filters','Control'],
  'MSPS':['Power Supply','Distribution','Monitoring'],
  'ITS':['Transport','Drive','Sensors'],
  'EC':['Controller','Firmware','I/O'],
  'DFE':['RIP','Network','Software'],
  'PQ':['Registration','Color','Calibration'],
  'QCS':['Inspection','Cameras','Lighting'],
  'PC Cabinet':['PC','OS','Peripherals'],
  'ICS':['Network','Switches','Config']
};

const sysSel=document.getElementById('system'), subSel=document.getElementById('subSystem');
function populateSystems(){
  sysSel.innerHTML=''; SYSTEMS.forEach(s=>{ const o=document.createElement('option'); o.textContent=s; sysSel.appendChild(o); });
  sysSel.dispatchEvent(new Event('change'));
}
sysSel.addEventListener('change', ()=>{
  const list = SUBSETS[sysSel.value] || ['General','Sensors','Controller','Power','Cooling','Transport','Software'];
  subSel.innerHTML=''; list.forEach(s=>{ const o=document.createElement('option'); o.textContent=s; subSel.appendChild(o); });
});

/* Machine Type toggle + numbers */
const typeToggle=document.getElementById('typeToggle');
const hiddenType=document.getElementById('machineType');
const numSel=document.getElementById('machineNumber');

typeToggle.querySelectorAll('.tbtn').forEach(btn=>{
  btn.onclick=()=>{
    typeToggle.querySelectorAll('.tbtn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    hiddenType.value = btn.dataset.type;
    loadMachines();
  };
});
function loadMachines(){
  const list = MACHINES[hiddenType.value] || [];
  numSel.innerHTML=''; list.forEach(n=>{ const o=document.createElement('option'); o.textContent=n; numSel.appendChild(o); });
}

/* TFS toggle */
const tfsToggle=document.getElementById('tfsToggle'), tfsInput=document.getElementById('tfsNumber');
tfsToggle.addEventListener('change', ()=> tfsInput.classList.toggle('hidden', !tfsToggle.checked));

/* Troubleshooting dynamic steps */
function addTS(val=''){
  const row=document.createElement('div'); row.className='inline'; row.style.marginBottom='6px';
  const i=document.createElement('input'); i.className='input'; i.placeholder='Step…'; i.value=val;
  const rm=document.createElement('button'); rm.className='btn small danger'; rm.type='button'; rm.textContent='Remove'; rm.onclick=()=>row.remove();
  row.appendChild(i); row.appendChild(rm); document.getElementById('tsList').appendChild(row);
}
addTS();

/* Files dynamic */
function addFileRow(){
  const wrap=document.getElementById('filesWrap');
  const row=document.createElement('div'); row.className='inline'; row.style.marginBottom='6px';
  const inp=document.createElement('input'); inp.type='file'; inp.className='input';
  inp.accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip";
  const rm=document.createElement('button'); rm.className='btn small danger'; rm.type='button'; rm.textContent='Remove'; rm.onclick=()=>row.remove();
  row.appendChild(inp); row.appendChild(rm); wrap.appendChild(row);
}
addFileRow();

/* Save / Validate */
function val(id){ const el=document.getElementById(id); return el?el.value:''; }
async function saveCase(e){
  e.preventDefault();
  const req = v => v && v.trim().length>0;
  const tsSteps = Array.from(document.querySelectorAll('#tsList .input')).map(i=>i.value).filter(Boolean);

  const data = {
    sfCase:val('sfCase'),
    tfsNumber: tfsToggle.checked ? val('tfsNumber') : '',
    machineType:val('machineType'),
    machineNumber:val('machineNumber'),
    softwareVersion:val('softwareVersion'),
    system:val('system'), subSystem:val('subSystem'),
    issueSummary:val('issueSummary'), symptoms:val('symptoms'),
    frequency:val('frequency'), environment:val('environment'),
    repro:val('repro'), rootCause:val('rootCause'), analysis:val('analysis'),
    troubleshooting:tsSteps, parts:val('parts'), solution:val('solution'), verification:val('verification'),
    createdAt:new Date().toISOString(), author:'Expert'
  };

  const errors = [];
  ['sfCase','machineType','machineNumber','system','issueSummary','solution'].forEach(k=>{ if(!req(data[k])) errors.push(k); });
  if(errors.length){
    toast('Please fill required: '+errors.join(', '),'err');
    errors.forEach(id=>{ const el=document.getElementById(id); if(el) el.style.borderColor='rgba(255,73,103,.6)';});
    setTimeout(()=>errors.forEach(id=>{ const el=document.getElementById(id); if(el) el.style.borderColor='var(--border)';}),1600);
    return;
  }

  // Files → base64
  const inputs=[...document.querySelectorAll('#filesWrap input[type="file"]')];
  const files=inputs.map(i=>i.files&&i.files[0]).filter(Boolean);
  if(files.length){
    data.attachments=[];
    for(const f of files){
      if(!/\.(pdf|docx?|xlsx?|png|jpg|jpeg|zip)$/i.test(f.name)){ toast('Unsupported file: '+f.name,'err'); continue; }
      const base64 = await new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(f); });
      data.attachments.push({name:f.name, type:f.type, data:base64});
    }
  }

  const arr=getCases(); arr.push(data); setCases(arr);
  caseForm.reset(); document.getElementById('tsList').innerHTML=''; addTS();
  document.getElementById('filesWrap').innerHTML=''; addFileRow();
  toast('Case saved','ok'); go('cases'); renderCases();
}

/* Render Cases */
function renderCases(){
  const q=(document.getElementById('searchBox').value||'').toLowerCase();
  const arr=getCases().filter(c=> !q ||
    (c.issueSummary||'').toLowerCase().includes(q) ||
    (c.machineNumber||'').toLowerCase().includes(q) ||
    (c.system||'').toLowerCase().includes(q)
  );
  document.getElementById('casesCount').textContent=arr.length;
  const list = document.getElementById('casesList');
  if(!arr.length){ list.innerHTML = '<div class="panel">No cases yet.</div>'; return; }
  list.innerHTML = arr.map((c,i)=> caseCard(c,i)).join('');
}
function caseCard(c,i){
  const files = Array.isArray(c.attachments)&&c.attachments.length ? `${c.attachments.length} file(s)` : 'No attachments';
  return `<div class="case-card">
    <div class="stripe"></div>
    <div>
      <div class="title">#${i+1} — ${esc(c.sfCase||'')}</div>
      <div class="meta">
        <span class="kv"><span class="k">Machine:</span><span class="v">${esc(c.machineNumber||'')} (${esc(c.machineType||'')})</span></span>
        <span class="kv"><span class="k">System:</span><span class="v">${esc(c.system||'')}${c.subSystem?' / '+esc(c.subSystem):''}</span></span>
        <span class="kv"><span class="k">SW:</span><span class="v">${esc(c.softwareVersion||'')}</span></span>
      </div>
      <div class="kv" style="margin-top:6px"><span class="k">Issue:</span><span class="v">${esc(c.issueSummary||'')}</span></div>
      <div class="help" style="margin-top:2px">${files}</div>
    </div>
    <div class="actions-inline">
      <button class="btn small" onclick="openCase(${i})">Details</button>
      <button class="btn small danger" onclick="delCase(${i})">Delete</button>
    </div>
  </div>`;
}
function openCase(i){
  const c=getCases()[i]; if(!c) return;
  document.getElementById('modalTitle').textContent = `Case #${i+1} — ${c.sfCase||''}`;
  const files = Array.isArray(c.attachments)&&c.attachments.length
    ? c.attachments.map(a => `<div class="kv"><span class="k">•</span>
        <a class="btn small" href="${a.data}" target="_blank" rel="noopener">View</a>
        <a class="btn small" href="${a.data}" download="${a.name}">Download</a>
        <span class="v">${esc(a.name)}</span></div>`).join('')
    : `<div class="attach-empty">No attachments</div>`;
  document.getElementById('modalBody').innerHTML = `
    <div class="grid cols-2">
      <div class="panel">
        <div class="kv"><span class="k">Machine:</span><span class="v">${esc(c.machineNumber||'')} (${esc(c.machineType||'')})</span></div>
        <div class="kv"><span class="k">System:</span><span class="v">${esc(c.system||'')}${c.subSystem?' / '+esc(c.subSystem):''}</span></div>
        <div class="kv"><span class="k">Software:</span><span class="v">${esc(c.softwareVersion||'')}</span></div>
        <div class="kv"><span class="k">TFS:</span><span class="v">${esc(c.tfsNumber||'')}</span></div>
        <div class="kv"><span class="k">Opened:</span><span class="v">${new Date(c.createdAt).toLocaleString()}</span></div>
        <div class="kv"><span class="k">Author:</span><span class="v">${esc(c.author||'')}</span></div>
      </div>
      <div class="panel">
        <h3>Problem</h3>
        <div class="kv"><span class="k">Summary:</span><span class="v">${esc(c.issueSummary||'')}</span></div>
        <div class="kv"><span class="k">Symptoms:</span><span class="v">${esc(c.symptoms||'')}</span></div>
        <div class="kv"><span class="k">Frequency:</span><span class="v">${esc(c.frequency||'')}</span></div>
        <div class="kv"><span class="k">Environment:</span><span class="v">${esc(c.environment||'')}</span></div>
      </div>
    </div>
    <div class="panel">
      <h3>Diagnostics</h3>
      <div class="kv"><span class="k">Reproduction:</span><span class="v">${br(esc(c.repro||''))}</span></div>
      <div class="kv"><span class="k">Root Cause:</span><span class="v">${br(esc(c.rootCause||''))}</span></div>
      <div class="kv"><span class="k">Analysis:</span><span class="v">${br(esc(c.analysis||''))}</span></div>
    </div>
    <div class="panel">
      <h3>Solution</h3>
      <div class="kv"><span class="k">Troubleshooting:</span><span class="v">${(c.troubleshooting||[]).map(s=>esc(s)).join('<br>')}</span></div>
      <div class="kv"><span class="k">Parts / Service:</span><span class="v">${br(esc(c.parts||''))}</span></div>
      <div class="kv"><span class="k">Implemented:</span><span class="v">${br(esc(c.solution||''))}</span></div>
      <div class="kv"><span class="k">Verification:</span><span class="v">${esc(c.verification||'')}</span></div>
      <div class="kv" style="margin-top:10px"><span class="k">Files:</span><span class="v">${files}</span></div>
    </div>`;
  openModal();
}
function delCase(i){
  const a=getCases(); if(!a[i]) return;
  if(!confirm('Delete this case?')) return;
  a.splice(i,1); setCases(a); renderCases(); toast('Case deleted','ok');
}

/* Modal / KPI / CSV */
function openModal(){ document.getElementById('modalBack').style.display='flex'; }
function closeModal(){ document.getElementById('modalBack').style.display='none'; }
function updateKPIs(){
  const a=getCases();
  kpiTotal.textContent = a.length;
  kpiFiles.textContent = a.filter(c=>Array.isArray(c.attachments)&&c.attachments.length).length;
  kpiUpdated.textContent = a.length? new Date(a[a.length-1].createdAt).toLocaleString() : '—';
  casesCount.textContent = a.length;
}
function exportCSV(){
  const a=getCases();
  const cols=['sfCase','tfsNumber','machineType','machineNumber','system','subSystem','softwareVersion','issueSummary','symptoms','frequency','environment','repro','rootCause','analysis','troubleshooting','parts','solution','verification','createdAt','author'];
  const csv=[cols.join(',')].concat(a.map(o=> cols.map(k=> JSON.stringify((Array.isArray(o[k])?o[k].join(' | '):(o[k]||'')).toString().replace(/\n/g,' '))).join(','))).join('\n');
  const blob=new Blob([csv],{type:'text/csv'}); const x=document.createElement('a'); x.href=URL.createObjectURL(blob); x.download='landa_cases.csv'; x.click();
}

/* Toasts & helpers */
function toast(msg,type='ok'){
  const t=document.createElement('div'); t.className='toast '+type; t.textContent=msg;
  toasts.appendChild(t); setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(),250); }, 1700);
}
const esc=s=> (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const br=s=> String(s||'').replace(/\n/g,'<br>');

/* Init */
(function init(){
  populateSystems();
  loadMachines();
})();
