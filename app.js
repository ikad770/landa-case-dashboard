// ===== Storage =====
const LS_KEY = 'landa_cases_v189';
function getCases(){
  try{return JSON.parse(localStorage.getItem(LS_KEY)||'[]');}
  catch(e){return [];}
}
function setCases(arr){
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
  updateKPIs();
}

// ===== DOM helpers =====
function $(id){return document.getElementById(id);}
function val(id){const el=$(id);return el?el.value:'';}
function toast(msg,type='ok'){
  const w=$('toasts');if(!w)return;
  const t=document.createElement('div');
  t.className='toast '+type;
  t.textContent=msg;
  w.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),250)},1600);
}
function esc(s){return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function nl(s){return String(s||'').replace(/\n/g,'<br>');}

// ===== Routing =====
const pages = ['dashboard','create','cases','diagnosis','settings'];
const fabNew = $('fabNew');

function go(route){
  pages.forEach(p=>{
    const sec = $('page-'+p);
    if(sec) sec.classList.add('hidden');
  });
  const tgt=$('page-'+route);
  if(tgt) tgt.classList.remove('hidden');

  document.querySelectorAll('.nav .item').forEach(a=>{
    const r=a.getAttribute('data-route');
    a.classList.toggle('active', r===route);
  });

  if(route==='dashboard') updateKPIs();
  if(route==='cases') renderCases();

  if(fabNew) fabNew.style.display = (route==='create') ? 'none' : 'block';

  window.scrollTo({top:0,behavior:'smooth'});
}

$('logoHome').addEventListener('click',()=>go('dashboard'));

document.querySelectorAll('.nav .item').forEach(a=>{
  const r=a.getAttribute('data-route');
  if(r){
    a.addEventListener('click',e=>{
      e.preventDefault();
      go(r);
      document.body.classList.remove('aside-open');
    });
  }
});

const btnMenu = $('btnMenu');
if(btnMenu){
  btnMenu.addEventListener('click',()=>{
    document.body.classList.toggle('aside-open');
  });
}
document.addEventListener('click',e=>{
  const aside = $('aside');
  const menu = $('btnMenu');
  if(aside && menu){
    if(!aside.contains(e.target) && !menu.contains(e.target)){
      document.body.classList.remove('aside-open');
    }
  }
});

// ===== Auth =====
const AUTH_KEY='landaAuthV189';
const loginPage=$('loginPage');
const appRoot=$('appRoot');

function showApp(){
  loginPage.classList.add('hidden');
  appRoot.classList.remove('hidden');
  go('dashboard');updateKPIs();
}
function showLogin(){
  appRoot.classList.add('hidden');
  loginPage.classList.remove('hidden');
}

$('btnLogin').addEventListener('click',()=>{
  const u=val('authUser').trim();
  const p=val('authPass').trim();
  if(u==='Expert' && p==='Landa123456'){
    toast('Welcome, Expert','ok');
    localStorage.setItem(AUTH_KEY,'true');
    setTimeout(showApp,600);
  }else{
    toast('Invalid credentials','err');
  }
});
if(localStorage.getItem(AUTH_KEY)==='true'){showApp();}

$('btnLogout').addEventListener('click',e=>{
  e.preventDefault();
  toast('Logged out','ok');
  localStorage.removeItem(AUTH_KEY);
  document.body.classList.remove('aside-open');
  setTimeout(showLogin,600);
});

// ===== Custom dropdown engine =====
function makeDropdown(container,{placeholder='Choose…',options=[],onChange=()=>{},maxHeight=260}){
  container.classList.add('dd');
  container.innerHTML=`
    <button type="button" class="dd-btn"><span class="dd-label">${placeholder}</span></button>
    <span class="dd-arrow" aria-hidden="true"></span>
    <div class="dd-list" style="max-height:${maxHeight}px"></div>
    <input type="hidden" class="dd-value" value="">
  `;
  const btn=container.querySelector('.dd-btn');
  const list=container.querySelector('.dd-list');
  const label=container.querySelector('.dd-label');
  const input=container.querySelector('.dd-value');

  let state={open:false,opts:options,index:-1};

  function render(){
    list.innerHTML='';
    if(!state.opts || !state.opts.length){
      list.innerHTML='<div class="dd-empty">No options</div>';
      return;
    }
    state.opts.forEach((o,i)=>{
      const it=document.createElement('div');
      it.className='dd-item';
      it.setAttribute('data-value',o.value);
      it.setAttribute('data-index',i);
      if(String(input.value)===String(o.value)) it.setAttribute('aria-selected','true');
      it.textContent=o.label ?? o.value;
      it.addEventListener('click',()=>selectIndex(i));
      list.appendChild(it);
    });
  }
  function open(){
    if(container.classList.contains('disabled'))return;
    container.classList.add('open');state.open=true;
    const idx=Math.max(0,state.opts.findIndex(o=>String(o.value)===String(input.value)));
    highlight(idx);adjustInView();
    window.addEventListener('click',outside);
    window.addEventListener('keydown',keys);
  }
  function close(){
    container.classList.remove('open');state.open=false;
    window.removeEventListener('click',outside);
    window.removeEventListener('keydown',keys);
  }
  function outside(e){if(!container.contains(e.target))close();}
  function keys(e){
    if(!state.open)return;
    if(e.key==='Escape'){close();btn.focus();}
    else if(e.key==='ArrowDown'){
      e.preventDefault();
      highlight(Math.min(state.index+1,state.opts.length-1));adjustInView();
    }else if(e.key==='ArrowUp'){
      e.preventDefault();
      highlight(Math.max(state.index-1,0));adjustInView();
    }else if(e.key==='Enter'){
      e.preventDefault();
      if(state.index>=0)selectIndex(state.index);
    }
  }
  function highlight(i){
    state.index=i;
    [...list.children].forEach(c=>c.classList.remove('hover'));
    if(list.children[i])list.children[i].classList.add('hover');
  }
  function adjustInView(){
    const el=list.children[state.index];if(!el)return;
    const r=el.getBoundingClientRect();const L=list.getBoundingClientRect();
    if(r.top<L.top)list.scrollTop-=(L.top-r.top)+6;
    if(r.bottom>L.bottom)list.scrollTop+=(r.bottom-L.bottom)+6;
  }
  function selectIndex(i){
    const o=state.opts[i];if(!o)return;
    input.value=o.value;label.textContent=o.label ?? o.value;
    [...list.children].forEach(x=>x.removeAttribute('aria-selected'));
    if(list.children[i])list.children[i].setAttribute('aria-selected','true');
    onChange(o.value,o.label ?? o.value);close();
  }

  btn.addEventListener('click',()=>state.open?close():open());
  render();
  return{
    setOptions(newOpts){state.opts=newOpts||[];render();if(!state.opts.some(o=>String(o.value)===String(input.value))){input.value='';label.textContent=placeholder;}},
    setValue(v){const i=state.opts.findIndex(o=>String(o.value)===String(v));if(i>=0)selectIndex(i);else{input.value='';label.textContent=placeholder;}},
    value(){return input.value;}
  };
}

// ===== Machine Type / Press mapping =====
const machineTypeChips = $('machineTypeChips');
const hiddenType = $('machineType');
const ddModel = makeDropdown($('dd-model'), {placeholder:'Choose press…',options:[]});

// mapping from earlier picture
const PRESS_NAMES = {
  Simplex:{
    S08:"ZRP",
    S10:"Virtual",
    S11:"Marketing",
    S12:"SWR MX",
    S14:"McGowans",
    S15:"BPI",
    S16:"K-1",
    S18:"Dugal",
    S19:"Neff",
    S20:"MM",
    S21:"SCT",
    S22:"Primary",
    S23:"FP Mercure",
    S24:"PGI TEA",
    S25:"Model",
    S26:"ZRP",
    S28:"SWR PL",
    S29:"Marketing",
    S30:"Neff",
    S32:"SWR IE",
    S35:"Wynalda"
  },
  Duplex:{
    D04:"Bluetree",
    D06:"GP",
    D07:"BluePrint",
    D09:"BJU",
    D11:"De Jong",
    D13:"Quad",
    D14:"Advantage",
    D16:"Superior",
    D18:"De Jong",
    D19:"Abeka",
    D21:"M13",
    D22:"Mapprint",
    D23:"Bluetree",
    D24:"Shenando",
    D25:"Wirtz",
    D26:"Advantage",
    D27:"Quantum",
    D28:"Publication",
    D29:"Marketing",
    D30:"Neff",
    D33:"Geiger"
  },
  Other:{
    "NS 40-105":"Komori"
  }
};
function getPressCustomer(kind,code){
  const map = PRESS_NAMES[kind] || {};
  return map[code] || "";
}
function fillModels(kind){
  const prefix=(kind==='Duplex')?'D':'S';
  const max=(kind==='Duplex')?33:35;
  const map=PRESS_NAMES[kind] || {};
  const opts=[];
  for(let i=1;i<=max;i++){
    const code=`${prefix}${i}`;
    const name=map[code];
    const label=name?`${code} – ${name}`:code;
    opts.push({value:code,label});
  }
  if(kind==='Duplex' && PRESS_NAMES.Other){
    Object.entries(PRESS_NAMES.Other).forEach(([code,name])=>{
      opts.push({value:code,label:`${code} – ${name}`});
    });
  }
  ddModel.setOptions(opts);
  ddModel.setValue('');
}
fillModels('Simplex');

machineTypeChips.addEventListener('click',e=>{
  const chip=e.target.closest('.chip');if(!chip)return;
  machineTypeChips.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  chip.classList.add('active');
  hiddenType.value=chip.dataset.type;
  fillModels(hiddenType.value);
});

// ===== Hierarchical systems (simplified demo – adjust as needed) =====
const HIER = {
  "BSS":{
    subSystems:["LIB","BCU","BCD&BTD Motors","BACS","Fly-Off","Air Knife","Hot Plate","Dancer","BCLS","Vacuum Box"],
    categories:{
      "HW":["Rollers","Sensors","Motors","Brackets","Gaskets","Spare Parts","Pipes","Encoders","Valves"],
      "SW":["LIA","RTC","OPC","Parameters","Inverters Version"],
      "EC":["Inverters","Cables","SSR","CB's","FEC's"]
    }
  }
};
const SYSTEMS = Object.keys(HIER).map(x=>({value:x,label:x}));

const ddSystem = makeDropdown($('dd-system'),{placeholder:'Choose system…',options:SYSTEMS,onChange:onSystem});
const ddSub    = makeDropdown($('dd-sub'),   {placeholder:'Select sub-system…',options:[],onChange:onSub});
const ddCat    = makeDropdown($('dd-cat'),   {placeholder:'HW / SW / EC',options:[],onChange:onCat});
const ddItem   = makeDropdown($('dd-item'),  {placeholder:'Select item…',options:[]});

const wrapSub  = $('wrap-sub');
const wrapCat  = $('wrap-cat');
const wrapItem = $('wrap-item');

function onSystem(val){
  wrapItem.classList.add('hidden');ddItem.setOptions([]);ddItem.setValue('');
  wrapCat.classList.add('hidden');ddCat.setOptions([]);ddCat.setValue('');
  wrapSub.classList.add('hidden');ddSub.setOptions([]);ddSub.setValue('');

  const node=HIER[val];if(!node)return;
  ddSub.setOptions(node.subSystems.map(s=>({value:s,label:s})));
  wrapSub.classList.remove('hidden');
}
function onSub(){
  wrapItem.classList.add('hidden');ddItem.setOptions([]);ddItem.setValue('');
  wrapCat.classList.add('hidden');ddCat.setOptions([]);ddCat.setValue('');

  const sys=ddSystem.value();
  if(!sys || !HIER[sys])return;
  const cats=Object.keys(HIER[sys].categories);
  ddCat.setOptions(cats.map(c=>({value:c,label:c})));
  wrapCat.classList.remove('hidden');
}
function onCat(catVal){
  wrapItem.classList.add('hidden');ddItem.setOptions([]);ddItem.setValue('');
  const sys=ddSystem.value();
  if(!sys || !catVal)return;
  const items=(HIER[sys].categories[catVal]||[]).map(x=>({value:x,label:x}));
  ddItem.setOptions(items);
  wrapItem.classList.remove('hidden');

  const partSection = $('partIssueSection');
  if(partSection){
    if(catVal==='HW'){partSection.classList.remove('hidden');}
    else{
      partSection.classList.add('hidden');
      const pi=$('partIssue');if(pi)pi.value='';
    }
  }
}

// ===== TFS toggle =====
const tfsToggle=$('tfsToggle');
const tfsNumber=$('tfsNumber');
tfsToggle.addEventListener('change',()=>{
  if(tfsToggle.checked){tfsNumber.classList.remove('hidden');tfsNumber.focus();}
  else{tfsNumber.classList.add('hidden');tfsNumber.value='';}
});

// ===== Troubleshooting steps =====
const tsSteps=$('tsSteps');
function addStep(val=''){
  const row=document.createElement('div');
  row.className='inline';
  row.style.margin='6px 0';
  const inp=document.createElement('input');
  inp.className='input v13';
  inp.placeholder='Describe a step…';
  inp.value=val;
  inp.style.flex='1';
  const rm=document.createElement('button');
  rm.className='btn small danger';
  rm.type='button';
  rm.textContent='Remove';
  rm.onclick=()=>row.remove();
  row.appendChild(inp);
  row.appendChild(rm);
  tsSteps.appendChild(row);
}
function collectSteps(){
  return [...tsSteps.querySelectorAll('input')].map(i=>i.value).filter(v=>String(v).trim()).join('\n');
}
addStep('Check connections and sensors');
addStep('Verify model-specific settings');

// ===== Files =====
function addFileRow(){
  const w=$('filesWrap');
  const row=document.createElement('div');
  row.className='inline';
  const inp=document.createElement('input');
  inp.type='file';
  inp.className='file';
  inp.accept='.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip';
  const rm=document.createElement('button');
  rm.className='btn small danger';
  rm.type='button';
  rm.textContent='Remove';
  rm.onclick=()=>row.remove();
  row.appendChild(inp);
  row.appendChild(rm);
  w.appendChild(row);
}
addFileRow();

// ===== Final solution – SW dependency toggle =====
const solutionVersionDependent = $('solutionVersionDependent');
const solutionFixVersions = $('solutionFixVersions');
if(solutionVersionDependent && solutionFixVersions){
  solutionVersionDependent.addEventListener('change',()=>{
    const on=solutionVersionDependent.checked;
    solutionFixVersions.style.display = on ? 'inline-block' : 'none';
    if(!on) solutionFixVersions.value='';
  });
}

// ===== Save Case =====
async function saveCase(e){
  e.preventDefault();
  const req=v=>v && String(v).trim().length>0;

  const pressType = val('machineType');
  const pressCode = ddModel.value();
  const pressCustomer = getPressCustomer(pressType,pressCode);

  const data = {
    sfCase: val('sfCase'),
    pressType,
    pressCode,
    pressCustomer,
    softwareVersion: val('softwareVersion'),
    tfsNumber: tfsToggle.checked ? val('tfsNumber') : '',
    system: ddSystem.value(),
    subSystem: ddSub.value(),
    category: ddCat.value(),
    item: ddItem.value(),
    issueSummary: val('issueSummary'),
    symptoms: val('symptoms'),
    troubleshooting: collectSteps(),
    partIssue: (ddCat.value()==='HW') ? val('partIssue') : '',
    finalSolution: val('finalSolution'),
    solutionVersionDependent: !!(solutionVersionDependent && solutionVersionDependent.checked),
    solutionFixVersions: (solutionVersionDependent && solutionVersionDependent.checked) ? val('solutionFixVersions') : '',
    verification: val('verification'),
    notes: val('notes'),
    attachments: [],
    createdAt: new Date().toISOString(),
    author:'Expert'
  };

  const errors=[];
  if(!req(data.sfCase))errors.push('SF Case');
  if(!req(pressCode))errors.push('Press Name');
  if(!req(data.system))errors.push('System');
  if(!req(data.subSystem))errors.push('Sub-System');
  if(!req(data.category))errors.push('Category');
  if(!req(data.item))errors.push('Item');
  if(!req(data.issueSummary))errors.push('Issue Summary');
  if(!req(data.finalSolution))errors.push('Final Solution');

  if(errors.length){
    toast('Please fill required: '+errors.join(', '),'err');
    return;
  }

  // files
  const inputs=[...document.querySelectorAll('#filesWrap input[type="file"]')];
  const files=inputs.map(i=>i.files&&i.files[0]).filter(Boolean);
  if(files.length){
    for(const f of files){
      const ok=/\.(pdf|docx?|xlsx?|png|jpg|jpeg|zip)$/i.test(f.name);
      if(!ok){toast('Unsupported file: '+f.name,'err');continue;}
      const base64=await new Promise(res=>{
        const r=new FileReader();
        r.onload=()=>res(r.result);
        r.readAsDataURL(f);
      });
      data.attachments.push({name:f.name,type:f.type,data:base64});
    }
  }

  const arr=getCases();
  arr.push(data);
  setCases(arr);

  // reset
  $('caseForm').reset();
  hiddenType.value='Simplex';
  machineTypeChips.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  machineTypeChips.querySelector('[data-type="Simplex"]').classList.add('active');
  fillModels('Simplex');

  ddSystem.setValue('');
  ddSub.setOptions([]);ddSub.setValue('');
  ddCat.setOptions([]);ddCat.setValue('');
  ddItem.setOptions([]);ddItem.setValue('');
  wrapSub.classList.add('hidden');
  wrapCat.classList.add('hidden');
  wrapItem.classList.add('hidden');

  $('filesWrap').innerHTML='';
  addFileRow();
  tsSteps.innerHTML='';
  addStep('Check connections and sensors');
  addStep('Verify model-specific settings');

  const partSection=$('partIssueSection');
  if(partSection)partSection.classList.add('hidden');

  toast('Case saved successfully','ok');
  go('cases');
}

// ===== Cases render / delete / export =====
function caseCard(c,i){
  const files=Array.isArray(c.attachments)&&c.attachments.length
    ? `${c.attachments.length} file(s)`
    : 'No attachments';

  const pressLabel = c.pressCode
    ? `${esc(c.pressCode)}${c.pressCustomer? ' – '+esc(c.pressCustomer):''}`
    : '';

  return `
  <div class="case-card">
    <div class="stripe"></div>
    <div>
      <div class="title">#${i+1} — ${esc(c.sfCase||'')}</div>
      <div class="meta">
        <span class="kv"><span class="k">Press:</span>
          <span class="v">${pressLabel} (${esc(c.pressType||'')})</span>
        </span>
        <span class="kv"><span class="k">System:</span>
          <span class="v">${esc(c.system||'')} / ${esc(c.subSystem||'')}</span>
        </span>
        <span class="kv"><span class="k">Category:</span>
          <span class="v">${esc(c.category||'')} → ${esc(c.item||'')}</span>
        </span>
        <span class="kv"><span class="k">SW:</span>
          <span class="v">${esc(c.softwareVersion||'')}</span>
        </span>
      </div>
      <div class="kv" style="margin-top:8px">
        <span class="k">Issue:</span><span class="v">${esc(c.issueSummary||'')}</span>
      </div>
      <div class="files" style="margin-top:4px">${files}</div>
    </div>
    <div class="actions">
      <button class="btn small" onclick="openCase(${i})">Details</button>
      <button class="btn small danger" onclick="deleteCase(${i})">Delete</button>
    </div>
  </div>`;
}

function renderCases(){
  const list = $('casesList');
  const q = (val('searchBox')||'').toLowerCase();
  const arr = getCases().filter(c=>{
    if(!q)return true;
    return (
      (c.issueSummary||'').toLowerCase().includes(q) ||
      (c.pressCode||'').toLowerCase().includes(q) ||
      (c.pressCustomer||'').toLowerCase().includes(q) ||
      (c.system||'').toLowerCase().includes(q) ||
      (c.softwareVersion||'').toLowerCase().includes(q)
    );
  });
  const badge = $('casesCount');
  if(badge)badge.textContent=String(arr.length);
  list.innerHTML = arr.length
    ? arr.map((c,i)=>caseCard(c,i)).join('')
    : '<div class="panel">No cases yet.</div>';
}

function openCase(i){
  const c=getCases()[i];if(!c)return;
  $('modalTitle').textContent = `Case #${i+1} — ${c.sfCase||''}`;

  const files=Array.isArray(c.attachments)&&c.attachments.length
    ? c.attachments.map(a=>`
      <div class="kv">
        <span class="k">•</span>
        <a class="btn small" href="${a.data}" target="_blank" rel="noopener">View</a>
        <a class="btn small" href="${a.data}" download="${a.name}">Download</a>
        <span class="v">${esc(a.name)}</span>
      </div>`).join('')
    : '<div class="attach-empty">No attachments</div>';

  const pressLabel=c.pressCode
    ? `${esc(c.pressCode)}${c.pressCustomer? ' – '+esc(c.pressCustomer):''}`
    : '';

  $('modalBody').innerHTML = `
    <div class="grid cols-2">
      <div class="panel">
        <div class="kv"><span class="k">Press:</span>
          <span class="v">${pressLabel} (${esc(c.pressType||'')})</span></div>
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

    <div class="panel" style="margin-top:12px">
      <h3>Problem</h3>
      <div class="kv"><span class="k">Issue:</span>
        <span class="v">${esc(c.issueSummary||'')}</span></div>
      <div class="kv"><span class="k">Symptoms:</span>
        <span class="v">${nl(esc(c.symptoms||''))}</span></div>
    </div>

    <div class="panel" style="margin-top:12px">
      <h3>Troubleshooting &amp; Solution</h3>
      <div class="kv"><span class="k">Steps:</span>
        <span class="v">${nl(esc(c.troubleshooting||''))}</span></div>
      ${c.partIssue
        ? `<div class="kv"><span class="k">Part issue (HW):</span>
             <span class="v">${nl(esc(c.partIssue||''))}</span></div>` : ''}
      <div class="kv"><span class="k">Final solution:</span>
        <span class="v">${nl(esc(c.finalSolution||''))}</span></div>
      ${c.solutionVersionDependent
        ? `<div class="kv"><span class="k">SW dependent:</span>
             <span class="v">Yes (fixed in: ${esc(c.solutionFixVersions||'')})</span></div>`
        : `<div class="kv"><span class="k">SW dependent:</span>
             <span class="v">No</span></div>`}
      <div class="kv"><span class="k">Verification:</span>
        <span class="v">${esc(c.verification||'')}</span></div>
      <div class="kv"><span class="k">Notes:</span>
        <span class="v">${nl(esc(c.notes||''))}</span></div>
      <div class="kv" style="margin-top:12px">
        <span class="k">Files:</span><span class="v">${files}</span></div>
    </div>
  `;
  openModal();
}

function deleteCase(i){
  const arr=getCases();
  if(!arr[i])return;
  if(!confirm('Delete this case?'))return;
  arr.splice(i,1);setCases(arr);renderCases();toast('Case deleted','ok');
}

function openModal(){$('modalBack').style.display='flex';}
function closeModal(){$('modalBack').style.display='none';}

function updateKPIs(){
  const arr=getCases();
  $('kpiTotal').textContent = arr.length;
  $('kpiFiles').textContent = arr.filter(c=>Array.isArray(c.attachments)&&c.attachments.length).length;
  const last = arr.length ? new Date(arr[arr.length-1].createdAt).toLocaleString() : '—';
  $('kpiUpdated').textContent = last;
  const pageCasesCount=$('casesCount');
  if(pageCasesCount)pageCasesCount.textContent=String(arr.length);
  updateDashboardStats(arr);
}

// Dashboard stats
function updateDashboardStats(arr){
  const byPress={},bySystem={},bySw={};
  for(const c of arr){
    if(c.pressCode){
      const key=c.pressCode+(c.pressCustomer?` – ${c.pressCustomer}`:'');
      byPress[key]=(byPress[key]||0)+1;
    }
    if(c.system || c.subSystem){
      const key=(c.system||'')+(c.subSystem?` / ${c.subSystem}`:'');
      bySystem[key]=(bySystem[key]||0)+1;
    }
    if(c.softwareVersion){
      bySw[c.softwareVersion]=(bySw[c.softwareVersion]||0)+1;
    }
  }
  const fillList=(id,map)=>{
    const el=$(id);if(!el)return;
    const entries=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,6);
    if(!entries.length){
      el.innerHTML='<li><span class="stat-label">No data yet</span></li>';
      return;
    }
    el.innerHTML=entries.map(([label,count])=>
      `<li><span class="stat-label">${esc(label)}</span><span class="stat-value">${count}</span></li>`
    ).join('');
  };
  fillList('statByPress',byPress);
  fillList('statBySystem',bySystem);
  fillList('statBySw',bySw);
}

function exportCSV(){
  const arr=getCases();
  const cols=[
    'sfCase','pressType','pressCode','pressCustomer',
    'softwareVersion','tfsNumber',
    'system','subSystem','category','item',
    'issueSummary','symptoms','troubleshooting','partIssue',
    'finalSolution','solutionVersionDependent','solutionFixVersions',
    'verification','notes','attachments','createdAt','author'
  ];
  const csv=[cols.join(',')]
    .concat(arr.map(o=>
      cols.map(k=>{
        const v = Array.isArray(o[k]) ? (o[k].length+' file(s)') : (o[k]??'');
        return JSON.stringify(String(v).replace(/\n/g,' '));
      }).join(',')
    )).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='landa_cases.csv';
  a.click();
}

// ===== Particles background =====
(function(){
  const c=$('particles');if(!c)return;
  const ctx=c.getContext('2d');let w,h;
  function resize(){w=c.width=innerWidth;h=c.height=innerHeight;}
  addEventListener('resize',resize);resize();
  const dots=Array.from({length:60},()=>({
    x:Math.random()*w,y:Math.random()*h,
    r:Math.random()*1.6+0.6,
    vx:(Math.random()-.5)*0.28,
    vy:(Math.random()-.5)*0.28
  }));
  function step(){
    ctx.clearRect(0,0,w,h);
    for(const d of dots){
      d.x+=d.vx;d.y+=d.vy;
      if(d.x<0||d.x>w)d.vx*=-1;
      if(d.y<0||d.y>h)d.vy*=-1;
      ctx.beginPath();
      ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
      ctx.fillStyle='rgba(59,208,255,0.25)';
      ctx.fill();
    }
    requestAnimationFrame(step);
  }
  step();
})();

// Initial
updateKPIs();
go('dashboard');
