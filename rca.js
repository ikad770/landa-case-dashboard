
/* ===== RCA (Root Cause Analyzer) dedicated ===== */
const RCA_LS_PREFIX='landa_rca_v18_9_';

function startDiagnosis(type){
  localStorage.setItem('landa_diag_issue', type);
  document.getElementById('diagSelect').classList.add('hidden');
  document.getElementById('diagStep1').classList.remove('hidden');

  const issueMap = { setoff:'SetOff', scratches:'Scratches', uniformity:'Uniformity', jetting:'Jetting', transfer:'Transfer' };
  const issueName = issueMap[type] || 'General';
  document.querySelector('#diagStep1 h3 span').textContent = issueName;

  const step2 = document.getElementById('diagStep2');
  step2.innerHTML = '';
  step2.classList.add('hidden');
  localStorage.removeItem('landa_diag_state');
  localStorage.removeItem('landa_diag_checklist');
}

function backToIssueSelect(){
  localStorage.removeItem('landa_diag_issue');
  localStorage.removeItem('landa_diag_state');
  localStorage.removeItem('landa_diag_checklist');
  document.getElementById('diagStep1').classList.add('hidden');
  const step2 = document.getElementById('diagStep2');
  step2.innerHTML = '';
  step2.classList.add('hidden');
  document.getElementById('diagSelect').classList.remove('hidden');
  document.getElementById('diagSelect').scrollIntoView({behavior:'smooth', block:'start'});
}

function selectDiagnosis(branch){
  const step2 = document.getElementById('diagStep2');
  step2.classList.remove('hidden');
  step2.innerHTML = buildRCA(branch);
  localStorage.setItem('landa_diag_state', branch);
  document.getElementById('diagStep1').scrollIntoView({behavior:'smooth'});
}

function buildRCA(branch){
  const subs = (typeof BRANCH_MAP!=='undefined' && BRANCH_MAP[branch]) ? BRANCH_MAP[branch] : Object.keys(SET_OFF_DATA.subsystems);
  const first = subs[0];
  return `
  <div class="panel">
    <div id="rcaTabs"></div>
    <div style="display:flex;gap:8px;align-items:center;margin-top:10px">
      <input id="rcaSearch" class="input" placeholder="Search checks/spec">
      <button class="btn" onclick="rcaApplySearch()">Filter</button>
      <button class="btn" onclick="rcaClearSearch()">Clear</button>
      <button class="btn" onclick="rcaMarkAll()">Mark All</button>
    </div>
    <div id="rcaList" style="margin-top:12px"></div>
  </div>`
  + setTimeout(()=>{
      const tabs = document.getElementById('rcaTabs');
      tabs.innerHTML = '';
      subs.forEach((s,i)=>{
        const el=document.createElement('div');
        el.className='rca-tab'+(i===0?' active':'');
        el.textContent=s; el.dataset.sub=s;
        el.onclick=()=>switchTab(s);
        tabs.appendChild(el);
      });
      switchTab(first);
    },0);
}

function currentSub(){ const t=document.querySelector('.rca-tab.active'); return t?t.dataset.sub:''; }
function switchTab(sub){
  document.querySelectorAll('.rca-tab').forEach(t=>t.classList.toggle('active', t.dataset.sub===sub));
  renderSubSystem(sub);
}
function rcaApplySearch(){ renderSubSystem(currentSub()); }
function rcaClearSearch(){ document.getElementById('rcaSearch').value=''; renderSubSystem(currentSub()); }
function rcaMarkAll(){ document.querySelectorAll('#rcaList input[type=checkbox]').forEach(cb=>{ cb.checked=true; cb.dispatchEvent(new Event('change')) }); }

function rcaId(sub,idx,suf){ return `rca_${sub}_${idx}_${suf}`; }
function isSpecRow(r){ const a=r.spec||[]; return a.length>0 && a.join(' ').trim()!==''; }

function renderSubSystem(sub){
  const list=document.getElementById('rcaList');
  const q=(document.getElementById('rcaSearch').value||'').toLowerCase().trim();
  const rows=(SET_OFF_DATA.subsystems[sub]||[]).map((r,i)=>({...r,_idx:i}));
  const filtered = q? rows.filter(r=> r.check.toLowerCase().includes(q) || (r.spec||[]).join(' ').toLowerCase().includes(q) ): rows;
  list.innerHTML = filtered.map(r=>rcaRow(sub,r)).join('') || '<div class="panel">No checks found.</div>';

  filtered.forEach(row=>{
    const cb=document.getElementById(rcaId(sub,row._idx,'cb'));
    const input=document.getElementById(rcaId(sub,row._idx,'input'));
    const dev=document.getElementById(rcaId(sub,row._idx,'dev'));
    cb.addEventListener('change',()=>{
      const en=cb.checked; input.disabled=!en;
      if(!en){ input.value=''; if(dev){dev.className='dev-pill dev-na'; dev.textContent='—'} }
      saveRowState(sub,row._idx);
    });
    input.addEventListener('input',()=>{ saveRowState(sub,row._idx); if(dev){ updateDeviation(sub,row._idx) } });
    const st=loadRowState(sub,row._idx);
    if(st){ cb.checked=!!st.done; input.value=st.actual||''; input.disabled=!cb.checked; if(dev){ updateDeviation(sub,row._idx) } }
    else { input.disabled=true; }
  });
}

function rcaRow(sub,row){
  const specText=(row.spec||[]).join(' | ');
  if(isSpecRow(row)){
    return `<div class="rca-row">
      <label style="display:flex;gap:10px;align-items:center">
        <input id="${rcaId(sub,row._idx,'cb')}" type="checkbox">
        <div><div style="font-weight:600">${esc(row.check)}</div><div class="spec-pill">${esc(specText)}</div></div>
      </label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        <input id="${rcaId(sub,row._idx,'input')}" class="input" placeholder="${specInputPlaceholder(row.spec)}">
        <div id="${rcaId(sub,row._idx,'dev')}" class="dev-pill dev-na">—</div>
      </div>
    </div>`;
  } else {
    return `<div class="rca-row">
      <label style="display:flex;gap:10px;align-items:center">
        <input id="${rcaId(sub,row._idx,'cb')}" type="checkbox">
        <div><div style="font-weight:600">${esc(row.check)}</div><div class="spec-pill">Free entry</div></div>
      </label>
      <div style="margin-top:8px">
        <input id="${rcaId(sub,row._idx,'input')}" class="input" placeholder="Enter observation">
      </div>
    </div>`;
  }
}

function specInputPlaceholder(a){
  const s=(a||[]).join(' ');
  if(/~\s*\d+(\.\d+)?/.test(s)) return '≈ value';
  if(/\d+(\.\d+)?\s*-\s*\d+(\.\d+)?/.test(s)) return 'number in range';
  if(/\d+%/.test(s)) return '% value';
  return 'value';
}

function parseSpec(a){
  const s=(a||[]).join(' ');
  let m=s.match(/(\d+(\.\d+)?)\s*-\s*(\d+(\.\d+)?)/); // range (units/percent)
  if(m){ return {type:'range', min:parseFloat(m[1]), max:parseFloat(m[3])}; }
  m=s.match(/~\s*(\d+(\.\d+)?)/); // approx center with ±5% or ±0.5
  if(m){
    const v=parseFloat(m[1]); const tol=Math.min(0.5, v*0.05);
    return {type:'approx', min:v-tol, max:v+tol};
  }
  return {type:'text'};
}

function updateDeviation(sub,idx){
  const list = SET_OFF_DATA.subsystems[sub]||[];
  const row = list[idx]; if(!row) return;
  const spec = parseSpec(row.spec||[]);
  const devEl = document.getElementById(rcaId(sub,idx,'dev'));
  if(!devEl) return;
  const valStr = document.getElementById(rcaId(sub,idx,'input')).value.trim();
  if(!valStr){ devEl.className='dev-pill dev-na'; devEl.textContent='—'; return; }
  let num = parseFloat(valStr.replace('%',''));
  if(isNaN(num)){ devEl.className='dev-pill dev-na'; devEl.textContent='N/A'; return; }
  if(spec.type==='range' || spec.type==='approx'){
    if(num>=spec.min && num<=spec.max){ devEl.className='dev-pill dev-ok'; devEl.textContent='Within spec'; }
    else { devEl.className='dev-pill dev-err'; devEl.textContent='Out of spec'; }
  } else { devEl.className='dev-pill dev-na'; devEl.textContent='—'; }
}

function saveRowState(sub,idx){
  const done = document.getElementById(rcaId(sub,idx,'cb')).checked;
  const actual = document.getElementById(rcaId(sub,idx,'input')).value;
  localStorage.setItem(RCA_LS_PREFIX+sub+'_'+idx, JSON.stringify({done, actual}));
}
function loadRowState(sub,idx){
  try{ return JSON.parse(localStorage.getItem(RCA_LS_PREFIX+sub+'_'+idx) || ''); }catch(e){ return null; }
}

/* ===== Persisted legacy checklist (kept for flow consistency) ===== */
function renderChecklist(type){
  let title='', checks=[];
  if(type==='drying'){
    title='Drying System Diagnostic';
    checks=[
      'Check IR lamp status and operation',
      'Verify temperature sensor readings',
      'Inspect airflow and exhaust levels',
      'Confirm paper transport speed',
      'Ensure drying rollers are clean and rotating'
    ];
  }else if(type==='coating'){
    title='Coating System Diagnostic';
    checks=[
      'Verify coating pump pressure',
      'Check coating viscosity and level',
      'Inspect applicator alignment',
      'Ensure UV lamps are operational',
      'Confirm correct coating profile is loaded'
    ];
  }else{
    title='Full Machine Diagnostic';
    checks=[
      'Inspect both drying and coating systems',
      'Run humidity calibration',
      'Verify general temperature sensors',
      'Check overall machine ventilation',
      'Review latest software parameters for SetOff issue'
    ];
  }
  return `
  <div class="panel">
    <h3>${title}</h3>
    <p>Mark each step as completed:</p>
    <div id="checklist" class="grid cols-1" style="gap:6px;margin-top:6px">
      ${checks.map((c,i)=>`
        <label style="display:flex;align-items:center;gap:8px">
          <input type="checkbox" id="chk${i}" onchange="saveChecklist()">
          <span>${c}</span>
        </label>`).join('')}
    </div>
    <button class="btn small" style="margin-top:12px" onclick="restartDiagnosis()">Restart Diagnosis</button>
  </div>`;
}
function saveChecklist(){
  const boxes=[...document.querySelectorAll('#checklist input[type="checkbox"]')];
  const done=boxes.map(b=>b.checked);
  localStorage.setItem('landa_diag_checklist', JSON.stringify(done));
}
function restartDiagnosis(){
  localStorage.removeItem('landa_diag_state');
  localStorage.removeItem('landa_diag_checklist');
  const step2=document.getElementById('diagStep2');
  step2.innerHTML=''; step2.classList.add('hidden');
  toast('Diagnosis restarted','ok');
}

/* ===== Restore persisted diagnosis state ===== */
(function loadDiagnosis(){
  const issue = localStorage.getItem('landa_diag_issue');
  const state = localStorage.getItem('landa_diag_state');
  const sel   = document.getElementById('diagSelect');
  const step1 = document.getElementById('diagStep1');
  const step2 = document.getElementById('diagStep2');

  const issueMap = { scratches:'Scratches', uniformity:'Uniformity', jetting:'Jetting', transfer:'Transfer', setoff:'SetOff' };

  if (issue) {
    sel.classList.add('hidden');
    step1.classList.remove('hidden');
    const name = issueMap[issue] || 'General';
    document.querySelector('#diagStep1 h3 span').textContent = name;

    if (state) {
      step2.classList.remove('hidden');
      step2.innerHTML = buildRCA(state);
      setTimeout(()=>{
        const tabs = document.querySelectorAll('.rca-tab');
        if(tabs.length){ tabs[0].click(); }
      },0);
    } else {
      step2.innerHTML = '';
      step2.classList.add('hidden');
    }
  } else {
    sel.classList.remove('hidden');
    step1.classList.add('hidden');
    step2.innerHTML = '';
    step2.classList.add('hidden');
  }
})();
