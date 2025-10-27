/* ======================================================
   LandaQuantum V13.3 Refined | Logic & Functionality
   ====================================================== */

/* ===== Particles Animation for Login ===== */
(function(){
  const wrap=document.getElementById('particles');
  if(!wrap) return;
  for(let i=0;i<40;i++){
    const d=document.createElement('div');
    d.className='particle';
    d.style.left=Math.random()*100+'%';
    d.style.top=(60+Math.random()*60)+'%';
    d.style.animationDuration=(12+Math.random()*12)+'s';
    d.style.opacity=.35+Math.random()*.35;
    wrap.appendChild(d);
  }
})();

/* ===== Login ===== */
const loginScreen=document.getElementById('loginScreen');
const appRoot=document.getElementById('appRoot');

document.getElementById('btnFill').onclick=()=>{
  authUser.value='Expert'; authPass.value='Landa123456';
};

document.getElementById('btnLogin').onclick=()=>{
  if(authUser.value.trim()==='Expert' && authPass.value==='Landa123456'){
    loginScreen.classList.add('hidden');
    appRoot.classList.remove('hidden');
    toast('Welcome, Expert','ok');
    go('dashboard');
    updateKPIs();
  } else toast('Invalid credentials','err');
};

/* ===== Navigation ===== */
const pages=['dashboard','create','cases','settings'];
function go(route){
  pages.forEach(p=>document.getElementById('page-'+p).classList.add('hidden'));
  document.getElementById('page-'+route).classList.remove('hidden');
  document.querySelectorAll('.nav .item').forEach(a=>a.classList.toggle('active',a.dataset.route===route));
  if(route==='dashboard') updateKPIs();
  if(route==='cases') renderCases();
  window.scrollTo({top:0,behavior:'smooth'});
}
document.getElementById('goHome').onclick=()=>go('dashboard');

/* ===== Storage ===== */
const LS_KEY='landa_cases_v13_3';
function getCases(){
  try{return JSON.parse(localStorage.getItem(LS_KEY)||'[]');}catch(e){return [];}
}
function setCases(a){localStorage.setItem(LS_KEY,JSON.stringify(a));updateKPIs();}

/* ===== Lists ===== */
const MACHINES={Simplex:['S2','S3','S5','S7'],Duplex:['D3','D5','D7','D9']};
const SYSTEMS=['BSS','STS','IPS','BCU','IRD','Hot Air','PSS','CWS','Ventilation','MSPS','ITS','EC','DFE','PQ','QCS','PC Cabinet','ICS'];
const SUBSETS={'BSS':['Sensors','Interface','Controller','Transport','Software','Power']};

const sysSel=document.getElementById('system');
const subSel=document.getElementById('subSystem');
function populateSystems(){
  sysSel.innerHTML='';
  SYSTEMS.forEach(s=>{const o=document.createElement('option');o.textContent=s;sysSel.appendChild(o);});
}
sysSel.addEventListener('change',()=>{
  const list=SUBSETS[sysSel.value]||['General','Sensors','Controller','Power','Cooling','Transport','Software'];
  subSel.innerHTML='';
  list.forEach(s=>{const o=document.createElement('option');o.textContent=s;subSel.appendChild(o);});
});

/* ===== Machine Type Toggle ===== */
const typeToggle=document.getElementById('typeToggle');
const hiddenType=document.getElementById('machineType');
const numSel=document.getElementById('machineNumber');

typeToggle.querySelectorAll('.tbtn').forEach(btn=>{
  btn.onclick=()=>{
    typeToggle.querySelectorAll('.tbtn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    hiddenType.value=btn.dataset.type;
    loadMachines();
  };
});
function loadMachines(){
  numSel.innerHTML='';
  (MACHINES[hiddenType.value]||[]).forEach(n=>{
    const o=document.createElement('option');o.textContent=n;numSel.appendChild(o);
  });
}

/* ===== TFS Toggle ===== */
const tfsToggle=document.getElementById('tfsToggle');
const tfsInput=document.getElementById('tfsNumber');
tfsToggle.addEventListener('change',()=>tfsInput.classList.toggle('hidden',!tfsToggle.checked));

/* ===== Troubleshooting Steps ===== */
function addTS(val=''){
  const row=document.createElement('div');
  row.className='inline';
  row.style.marginBottom='6px';
  const i=document.createElement('input');
  i.className='input';
  i.placeholder='Step...';
  i.value=val;
  const rm=document.createElement('button');
  rm.className='btn small danger';
  rm.type='button';
  rm.textContent='Remove';
  rm.onclick=()=>row.remove();
  row.appendChild(i);
  row.appendChild(rm);
  document.getElementById('tsList').appendChild(row);
}
addTS();

/* ===== File Uploads ===== */
function addFileRow(){
  const wrap=document.getElementById('filesWrap');
  const row=document.createElement('div');
  row.className='inline';
  row.style.marginBottom='6px';
  const inp=document.createElement('input');
  inp.type='file';
  inp.className='input';
  inp.accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip";
  const rm=document.createElement('button');
  rm.className='btn small danger';
  rm.type='button';
  rm.textContent='Remove';
  rm.onclick=()=>row.remove();
  row.appendChild(inp);
  row.appendChild(rm);
  wrap.appendChild(row);
}
addFileRow();

/* ===== Save Case ===== */
async function saveCase(e){
  e.preventDefault();
  const req=v=>v&&v.trim().length>0;
  const tsSteps=Array.from(document.querySelectorAll('#tsList .input')).map(i=>i.value).filter(Boolean);
  const data={
    sfCase:sfCase.value,
    tfs:tfsToggle.checked?tfsNumber.value:'',
    machineType:machineType.value,
    machineNumber:machineNumber.value,
    softwareVersion:softwareVersion.value,
    system:system.value,
    subSystem:subSystem.value,
    issueSummary:issueSummary.value,
    symptoms:symptoms.value,
    frequency:frequency.value,
    environment:environment.value,
    repro:repro.value,
    rootCause:rootCause.value,
    analysis:analysis.value,
    troubleshooting:tsSteps,
    parts:parts.value,
    solution:solution.value,
    verification:verification.value,
    created:new Date().toLocaleString(),
    author:'Expert'
  };

  const errors=['sfCase','machineNumber','system','issueSummary','solution'].filter(id=>{
    const v=document.getElementById(id)?.value||'';
    return !req(v);
  });
  if(errors.length){
    toast('Fill required: '+errors.join(', '),'err');
    return;
  }

  const arr=getCases();
  arr.push(data);
  setCases(arr);
  toast('Case saved','ok');
  renderCases();
  go('cases');
}

/* ===== Render Cases ===== */
function renderCases(){
  const arr=getCases();
  document.getElementById('casesCount').textContent=arr.length;
  const list=document.getElementById('casesList');
  if(!arr.length){list.innerHTML='<div class="panel">No cases yet.</div>';return;}
  list.innerHTML=arr.map((c,i)=>`
    <div class="case-card">
      <div class="stripe"></div>
      <div>
        <div class="title">#${i+1} – ${c.sfCase}</div>
        <div class="meta">${c.machineNumber} (${c.machineType}) • ${c.system}</div>
        <div style="margin-top:4px">Issue: ${c.issueSummary}</div>
        <div class="help" style="margin-top:3px">${c.parts? 'With Parts':'No Parts'}</div>
      </div>
      <div><button class="btn small" onclick="viewCase(${i})">View</button></div>
    </div>`).join('');
}

/* ===== View Case (Modal) ===== */
function viewCase(i){
  const c=getCases()[i];
  if(!c)return;
  const body=`
  <div class="panel">
    <h3>${c.sfCase}</h3>
    <div><b>Machine:</b> ${c.machineNumber} (${c.machineType})</div>
    <div><b>System:</b> ${c.system}${c.subSystem?' / '+c.subSystem:''}</div>
    <div><b>Issue:</b> ${c.issueSummary}</div>
    <div><b>Root Cause:</b> ${c.rootCause}</div>
    <div><b>Solution:</b> ${c.solution}</div>
    <div><b>Verification:</b> ${c.verification}</div>
    <div><b>Steps:</b><br>${(c.troubleshooting||[]).join('<br>')}</div>
    <div><b>Created:</b> ${c.created}</div>
  </div>`;
  document.getElementById('modalTitle').textContent=`Case #${i+1}`;
  document.getElementById('modalBody').innerHTML=body;
  document.getElementById('modalBack').style.display='flex';
}
function closeModal(){document.getElementById('modalBack').style.display='none';}

/* ===== Toast ===== */
function toast(msg,type='ok'){
  const t=document.createElement('div');
  t.className='toast '+type;
  t.textContent=msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(()=>t.remove(),2000);
}

/* ===== KPI Update ===== */
function updateKPIs(){
  const a=getCases();
  kpiTotal.textContent=a.length;
  kpiFiles.textContent=a.filter(x=>x.parts).length;
  kpiUpdated.textContent=a.length?a[a.length-1].created:'—';
}

/* ===== CSV Export ===== */
function exportCSV(){
  const a=getCases();
  const cols=Object.keys(a[0]||{});
  const csv=[cols.join(',')].concat(a.map(o=>cols.map(k=>JSON.stringify(o[k]||'')).join(','))).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const url=URL.createObjectURL(blob);
  const aEl=document.createElement('a');
  aEl.href=url;
  aEl.download='landa_cases.csv';
  aEl.click();
  URL.revokeObjectURL(url);
}

/* ===== Init ===== */
(function init(){
  populateSystems();
  loadMachines();
})();
