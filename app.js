// ===== Storage helpers =====
const LS_KEY = 'landa_cases_v13';
function getCases(){
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch(e){ return []; }
}
function setCases(arr){
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
  updateKPIs();
}

// ===== Auth =====
const AUTH_KEY = 'landaAuth';
const loginPage = document.getElementById('loginPage');
const appRoot   = document.getElementById('appRoot');

function showApp(){
  loginPage.classList.add('hidden');
  appRoot.classList.remove('hidden');
  go('dashboard');
  updateKPIs();
}
function showLogin(){
  appRoot.classList.add('hidden');
  loginPage.classList.remove('hidden');
}

document.getElementById('btnLogin').addEventListener('click', ()=>{
  const u = document.getElementById('authUser').value.trim();
  const p = document.getElementById('authPass').value.trim();
  if(u === 'Expert' && p === 'Landa123456'){
    toast('Welcome, Expert','ok');
    localStorage.setItem(AUTH_KEY,'true');
    setTimeout(showApp, 500);
  } else {
    toast('Invalid credentials','err');
  }
});
if(localStorage.getItem(AUTH_KEY) === 'true'){ showApp(); }

document.getElementById('btnLogout').addEventListener('click', e=>{
  e.preventDefault();
  toast('Logged out','ok');
  localStorage.removeItem(AUTH_KEY);
  document.body.classList.remove('aside-open');
  setTimeout(showLogin, 400);
});

// ===== Routing =====
const pages = ['dashboard','create','cases','diagnosis','settings'];
const fabNew = document.getElementById('fabNew');

function go(route){
  pages.forEach(p=>{
    const el = document.getElementById('page-'+p);
    if(el) el.classList.add('hidden');
  });
  const tgt = document.getElementById('page-'+route);
  if(tgt) tgt.classList.remove('hidden');

  document.querySelectorAll('.nav .item').forEach(a=>{
    const r = a.getAttribute('data-route');
    a.classList.toggle('active', r === route);
  });

  if(route === 'dashboard') updateKPIs();
  if(route === 'cases') renderCases && renderCases();
  if(route === 'diagnosis') initRCA && initRCA();

  if(fabNew) fabNew.style.display = (route === 'create') ? 'none' : 'block';
  window.scrollTo({top:0, behavior:'smooth'});
}
document.getElementById('logoHome').addEventListener('click', ()=> go('dashboard'));
document.querySelectorAll('.nav .item').forEach(a=>{
  const r = a.getAttribute('data-route');
  if(!r) return;
  a.addEventListener('click', e=>{
    e.preventDefault();
    go(r);
    if(document.body.classList.contains('aside-open')){
      document.body.classList.remove('aside-open');
    }
  });
});
const btnMenu = document.getElementById('btnMenu');
if(btnMenu) btnMenu.addEventListener('click',
  ()=> document.body.classList.toggle('aside-open'));

// ===== Toast =====
function toast(msg, type='ok'){
  const w = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast '+type;
  t.textContent = msg;
  w.appendChild(t);
  setTimeout(()=>{
    t.style.opacity='0';
    setTimeout(()=> t.remove(), 250);
  }, 1600);
}

// ===== Custom dropdown engine =====
function makeDropdown(container, { placeholder='Choose…', options=[], onChange=()=>{}, maxHeight=260 }){
  container.classList.add('dd');
  container.innerHTML = `
    <button type="button" class="dd-btn"><span class="dd-label">${placeholder}</span></button>
    <span class="dd-arrow" aria-hidden="true"></span>
    <div class="dd-list" style="max-height:${maxHeight}px"></div>
    <input type="hidden" class="dd-value" value="">
  `;
  const btn   = container.querySelector('.dd-btn');
  const list  = container.querySelector('.dd-list');
  const label = container.querySelector('.dd-label');
  const input = container.querySelector('.dd-value');
  let state = { open:false, opts:options, index:-1 };

  function render(){
    list.innerHTML='';
    if(!state.opts || !state.opts.length){
      list.innerHTML = `<div class="dd-empty">No options</div>`;
      return;
    }
    state.opts.forEach((o,i)=>{
      const it = document.createElement('div');
      it.className='dd-item';
      it.dataset.value = o.value;
      it.dataset.index = i;
      if(String(input.value) === String(o.value)) it.setAttribute('aria-selected','true');
      it.textContent = o.label ?? o.value;
      it.addEventListener('click', ()=> selectIndex(i));
      list.appendChild(it);
    });
  }
  function open(){
    if(container.classList.contains('disabled')) return;
    container.classList.add('open');
    state.open=true;
    const idx = Math.max(0, state.opts.findIndex(o=> String(o.value) === String(input.value)));
    highlight(idx);
    adjustInView();
    window.addEventListener('click', outside);
    window.addEventListener('keydown', keys);
  }
  function close(){
    container.classList.remove('open');
    state.open=false;
    window.removeEventListener('click', outside);
    window.removeEventListener('keydown', keys);
  }
  function outside(e){ if(!container.contains(e.target)) close(); }
  function keys(e){
    if(!state.open) return;
    if(e.key==='Escape'){ close(); btn.focus(); }
    else if(e.key==='ArrowDown'){
      e.preventDefault();
      highlight(Math.min(state.index+1, state.opts.length-1));
      adjustInView();
    } else if(e.key==='ArrowUp'){
      e.preventDefault();
      highlight(Math.max(state.index-1, 0));
      adjustInView();
    } else if(e.key==='Enter'){
      e.preventDefault();
      if(state.index>=0) selectIndex(state.index);
    }
  }
  function highlight(i){
    state.index=i;
    [...list.children].forEach(c=>c.classList.remove('hover'));
    if(list.children[i]) list.children[i].classList.add('hover');
  }
  function adjustInView(){
    const el=list.children[state.index];
    if(!el) return;
    const r=el.getBoundingClientRect();
    const L=list.getBoundingClientRect();
    if(r.top<L.top) list.scrollTop -= (L.top-r.top)+6;
    if(r.bottom>L.bottom) list.scrollTop += (r.bottom-L.bottom)+6;
  }
  function selectIndex(i){
    const o = state.opts[i];
    if(!o) return;
    input.value = o.value;
    label.textContent = o.label ?? o.value;
    [...list.children].forEach(x=>x.removeAttribute('aria-selected'));
    if(list.children[i]) list.children[i].setAttribute('aria-selected','true');
    onChange(o.value, o.label ?? o.value);
    close();
  }

  btn.addEventListener('click', ()=> state.open ? close() : open());
  const api = {
    setOptions(newOpts){
      state.opts = newOpts || [];
      render();
      if(!state.opts.some(o=> String(o.value) === String(input.value))){
        input.value=''; label.textContent=placeholder;
      }
    },
    setValue(v){
      const i = state.opts.findIndex(o=> String(o.value) === String(v));
      if(i>=0) selectIndex(i);
      else { input.value=''; label.textContent=placeholder; }
    },
    value(){ return input.value; },
    disable(flag){ container.classList.toggle('disabled', !!flag); }
  };
  render();
  return api;
}

// ===== Press map (placeholder customer names – replace labels as needed) =====
const PRESS_MAP = {
  Simplex: [
    { value:'S1', label:'S1 – Customer 1' },
    { value:'S2', label:'S2 – Customer 2' },
    { value:'S3', label:'S3 – Customer 3' },
    { value:'S4', label:'S4 – Customer 4' },
    { value:'S5', label:'S5 – Customer 5' },
    { value:'S6', label:'S6 – Customer 6' },
    { value:'S7', label:'S7 – Customer 7' },
    { value:'S8', label:'S8 – Customer 8' },
    { value:'S9', label:'S9 – Customer 9' },
    { value:'S10', label:'S10 – Customer 10' },
    { value:'S11', label:'S11 – Customer 11' },
    { value:'S12', label:'S12 – Customer 12' },
    { value:'S13', label:'S13 – Customer 13' },
    { value:'S14', label:'S14 – Customer 14' },
    { value:'S15', label:'S15 – Customer 15' },
    { value:'S16', label:'S16 – Customer 16' },
    { value:'S17', label:'S17 – Customer 17' }
  ],
  Duplex: [
    { value:'D1', label:'D1 – Customer A' },
    { value:'D2', label:'D2 – Customer B' },
    { value:'D3', label:'D3 – Customer C' },
    { value:'D4', label:'D4 – Customer D' },
    { value:'D5', label:'D5 – Customer E' },
    { value:'D6', label:'D6 – Customer F' }
  ]
};

// ===== System hierarchy (currently only BSS fully defined) =====
const HIER = {
  "BSS": {
    subSystems: [
      "LIB","BCU","BCD&BTD Motors","BACS","Fly-Off","Air Knife","Hot Plate","Dancer","BCLS","Vacuum Box"
    ],
    categories: {
      "HW": ["Rollers","Sensors","Motors","Brackets","Gaskets","Spare Parts","Pipes","Encoders","Valves"],
      "SW": ["LIA","RTC","OPC","Parameters","Inverters Version"],
      "EC": ["Inverters","Cables","SSR","CB's","FEC's"]
    }
  }
  // TODO: add more systems as needed, keeping same structure
};
const SYSTEMS = Object.keys(HIER).map(x=>({value:x, label:x}));

// ===== Create Case wiring =====
const pressTypeChips = document.getElementById('pressTypeChips');
const hiddenPressType = document.getElementById('pressType');
const ddPress = makeDropdown(document.getElementById('dd-press'), {
  placeholder:'Select press…',
  options:[]
});

function fillPresses(kind){
  const opts = PRESS_MAP[kind] || [];
  ddPress.setOptions(opts);
  ddPress.setValue('');
}
fillPresses(hiddenPressType.value || 'Simplex');
ddPress.setValue('');
pressTypeChips.addEventListener('click', e=>{
  const chip = e.target.closest('.chip');
  if(!chip) return;
  pressTypeChips.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  chip.classList.add('active');
  const kind = chip.dataset.type;
  hiddenPressType.value = kind;
  fillPresses(kind);
});

// System dropdowns
const ddSystem = makeDropdown(document.getElementById('dd-system'), {
  placeholder:'Choose…',
  options:SYSTEMS,
  onChange:onSystem
});
const wrapSub = document.getElementById('wrap-sub');
const wrapCat = document.getElementById('wrap-cat');
const wrapItem= document.getElementById('wrap-item');

const ddSub = makeDropdown(document.getElementById('dd-sub'), {
  placeholder:'Select sub-system…',
  options:[],
  onChange:onSub
});
const ddCat = makeDropdown(document.getElementById('dd-cat'), {
  placeholder:'HW / SW / EC',
  options:[],
  onChange:onCat
});
const ddItem= makeDropdown(document.getElementById('dd-item'), {
  placeholder:'Select item…',
  options:[]
});

function onSystem(val){
  wrapItem.classList.add('hidden'); ddItem.setOptions([]); ddItem.setValue('');
  wrapCat.classList.add('hidden');  ddCat.setOptions([]); ddCat.setValue('');
  wrapSub.classList.add('hidden');  ddSub.setOptions([]); ddSub.setValue('');

  const node = HIER[val];
  if(!node) return;
  ddSub.setOptions(node.subSystems.map(s=>({value:s, label:s})));
  wrapSub.classList.remove('hidden');
}
function onSub(){
  wrapItem.classList.add('hidden'); ddItem.setOptions([]); ddItem.setValue('');
  wrapCat.classList.add('hidden');  ddCat.setOptions([]); ddCat.setValue('');

  const sys = ddSystem.value();
  if(!sys || !HIER[sys]) return;
  const cats = Object.keys(HIER[sys].categories || {});
  ddCat.setOptions(cats.map(c=>({value:c, label:c})));
  wrapCat.classList.remove('hidden');
}
function onCat(catVal){
  wrapItem.classList.add('hidden'); ddItem.setOptions([]); ddItem.setValue('');
  const sys = ddSystem.value();
  if(!sys || !catVal) return;
  const items = (HIER[sys].categories[catVal] || []).map(x=>({value:x,label:x}));
  ddItem.setOptions(items);
  wrapItem.classList.remove('hidden');
}

// TFS toggle
const tfsToggle = document.getElementById('tfsToggle');
const tfsNumber = document.getElementById('tfsNumber');
tfsToggle.addEventListener('change', ()=>{
  if(tfsToggle.checked){
    tfsNumber.classList.remove('hidden');
    tfsNumber.focus();
  } else {
    tfsNumber.classList.add('hidden');
    tfsNumber.value='';
  }
});

// Solution version-dependent
const solVersionDependent = document.getElementById('solVersionDependent');
const solVersionWrap      = document.getElementById('solVersionWrap');
solVersionDependent.addEventListener('change', ()=>{
  solVersionWrap.classList.toggle('hidden', !solVersionDependent.checked);
  if(!solVersionDependent.checked){
    document.getElementById('solVersionText').value='';
  }
});

// Troubleshooting steps
const tsSteps = document.getElementById('tsSteps');
function addStep(val=''){
  const row = document.createElement('div');
  row.className = 'inline';
  row.style.margin='6px 0';
  const inp = document.createElement('input');
  inp.className='input v13';
  inp.placeholder='Describe a step…';
  inp.value = val;
  inp.style.flex='1';
  const rm = document.createElement('button');
  rm.className='btn small danger';
  rm.type='button';
  rm.textContent='Remove';
  rm.onclick=()=>row.remove();
  row.appendChild(inp);
  row.appendChild(rm);
  tsSteps.appendChild(row);
}
addStep('Check connections and sensors');
addStep('Verify model-specific settings');

// Part smart suggest (demo)
const partInput   = document.getElementById('partInput');
const partSuggest = document.getElementById('partSuggest');
if(partInput){
  const parts = Array.from({length:160},(_,i)=> ((i%2===0)?'12':'34') + '-' + String(10000+i).slice(-5));
  const filterParts = q=>{
    const v = String(q||'').trim().toLowerCase();
    if(!v) return [];
    return parts.filter(p=>p.toLowerCase().includes(v)).slice(0,30);
  };
  partInput.addEventListener('input', ()=>{
    const list = filterParts(partInput.value);
    partSuggest.innerHTML='';
    if(!list.length){
      partSuggest.style.display='none';
      return;
    }
    list.forEach(p=>{
      const row=document.createElement('div');
      row.textContent=p;
      row.addEventListener('click', ()=>{
        partInput.value=p;
        partSuggest.style.display='none';
      });
      partSuggest.appendChild(row);
    });
    partSuggest.style.display='block';
  });
  document.addEventListener('click', e=>{
    if(!partSuggest.contains(e.target) && e.target !== partInput){
      partSuggest.style.display='none';
    }
  });
}

// Files
function addFileRow(){
  const w=document.getElementById('filesWrap');
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

// ===== Save Case =====
async function saveCase(e){
  e.preventDefault();
  const req = v => v && String(v).trim().length>0;

  const data = {
    sfCase:          val('sfCase'),
    pressType:       val('pressType'),
    pressName:       ddPress.value(),
    softwareVersion: val('softwareVersion'),
    tfsNumber:       tfsToggle.checked ? val('tfsNumber') : '',
    system:          ddSystem.value(),
    subSystem:       ddSub.value(),
    category:        ddCat.value(),
    item:            ddItem.value(),
    issueSummary:    val('issueSummary'),
    symptoms:        val('symptoms'),
    troubleshooting: collectSteps(),
    partCatalog:     val('partInput'),
    solution:        val('solution'),
    solutionVersionDependent: solVersionDependent.checked,
    solutionVersions: solVersionDependent.checked ? val('solVersionText') : '',
    verification:    val('verification'),
    notes:           val('notes'),
    attachments:     [],
    createdAt:       new Date().toISOString(),
    author:          'Expert'
  };

  const errors = [];
  if(!req(data.sfCase))       errors.push('SF Case');
  if(!req(data.pressType))    errors.push('Press Type');
  if(!req(data.pressName)){
    toast('Please select a Press Name', 'err');
    return;
}
  if(!req(data.system))       errors.push('System');
  if(!req(data.subSystem))    errors.push('Sub-System');
  if(!req(data.category))     errors.push('Category');
  if(!req(data.item))         errors.push('Item');
  if(!req(data.issueSummary)) errors.push('Issue Summary');
  if(!req(data.solution))     errors.push('Final Solution');

  if(errors.length){
    toast('Please fill required: ' + errors.join(', '),'err');
    return;
  }

  // files
  const inputs = [...document.querySelectorAll('#filesWrap input[type="file"]')];
  const files  = inputs.map(i=>i.files && i.files[0]).filter(Boolean);
  if(files.length){
    for(const f of files){
      const ok = /\.(pdf|docx?|xlsx?|png|jpg|jpeg|zip)$/i.test(f.name);
      if(!ok){
        toast('Unsupported file: '+f.name,'err');
        continue;
      }
      const base64 = await new Promise(res=>{
        const r=new FileReader();
        r.onload = ()=>res(r.result);
        r.readAsDataURL(f);
      });
      data.attachments.push({name:f.name, type:f.type, data:base64});
    }
  }

  const arr = getCases();
  arr.push(data);
  setCases(arr);

  // reset form
  document.getElementById('caseForm').reset();
  hiddenPressType.value = 'Simplex';
  pressTypeChips.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  pressTypeChips.querySelector('[data-type="Simplex"]').classList.add('active');
  fillPresses('Simplex');

  ddSystem.setValue(''); ddSub.setOptions([]); ddSub.setValue('');
  ddCat.setOptions([]);  ddCat.setValue('');  ddItem.setOptions([]); ddItem.setValue('');
  wrapSub.classList.add('hidden'); wrapCat.classList.add('hidden'); wrapItem.classList.add('hidden');

  document.getElementById('filesWrap').innerHTML=''; addFileRow();
  tsSteps.innerHTML='';
  addStep('Check connections and sensors');
  addStep('Verify model-specific settings');
  solVersionDependent.checked=false;
  solVersionWrap.classList.add('hidden');
  document.getElementById('solVersionText').value='';

  toast('Case saved successfully','ok');
  go('cases');
}
function collectSteps(){
  return [...tsSteps.querySelectorAll('.inline input')]
    .map(i=>i.value)
    .filter(v=>String(v).trim())
    .join('\n');
}
function val(id){
  const el=document.getElementById(id);
  return el ? el.value : '';
}

// ===== Cases & Dashboard utilities (used also by cases.js) =====
function esc(s){
  return (s||'').replace(/[&<>"]/g, c=>(
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]
  ));
}
function nl(s){ return String(s||'').replace(/\n/g,'<br>'); }

function updateKPIs(){
  const arr = getCases();
  const kpiTotal   = document.getElementById('kpiTotal');
  const kpiUpdated = document.getElementById('kpiUpdated');
  const kpiPresses = document.getElementById('kpiPresses');
  const kpiSW      = document.getElementById('kpiSW');
  const badge      = document.getElementById('casesCount');

  if(kpiTotal)   kpiTotal.textContent   = arr.length;
  if(badge)      badge.textContent      = String(arr.length);
  if(kpiUpdated) kpiUpdated.textContent = arr.length
    ? new Date(arr[arr.length-1].createdAt).toLocaleString()
    : '—';

  const uniq = (list)=> Array.from(new Set(list.filter(Boolean)));
  if(kpiPresses) kpiPresses.textContent = uniq(arr.map(c=>c.pressName)).length;
  if(kpiSW)      kpiSW.textContent      = uniq(arr.map(c=>c.softwareVersion)).length;

  // dashboard distributions
  const byCustomer = {};
  const bySystem   = {};
  const bySW       = {};
  arr.forEach(c=>{
    const cust = c.pressName || 'Unknown';
    const sys  = c.system || 'Unknown';
    const sw   = c.softwareVersion || '—';
    byCustomer[cust] = (byCustomer[cust]||0)+1;
    bySystem[sys]    = (bySystem[sys]||0)+1;
    bySW[sw]         = (bySW[sw]||0)+1;
  });
  fillMiniList('dashByCustomer', byCustomer);
  fillMiniList('dashBySystem',   bySystem);
  fillMiniList('dashBySW',       bySW);
}
function fillMiniList(id, obj){
  const el=document.getElementById(id);
  if(!el) return;
  const entries = Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,8);
  if(!entries.length){
    el.innerHTML = '<div class="row"><span>No data yet</span><span></span></div>';
    return;
  }
  el.innerHTML = entries.map(([k,v])=>(
    `<div class="row"><span>${esc(k)}</span><span>${v}</span></div>`
  )).join('');
}

// ===== Export CSV =====
function exportCSV(){
  const arr=getCases();
  const cols = [
    'sfCase','pressType','pressName','softwareVersion','tfsNumber',
    'system','subSystem','category','item',
    'issueSummary','symptoms','troubleshooting','partCatalog',
    'solution','solutionVersionDependent','solutionVersions',
    'verification','notes','attachments','createdAt','author'
  ];
  const header = cols.join(',');
  const rows = arr.map(o=>{
    return cols.map(k=>{
      let v = o[k];
      if(Array.isArray(v)) v = v.length + ' file(s)';
      if(v === undefined || v === null) v = '';
      v = String(v).replace(/\n/g,' ');
      return JSON.stringify(v);
    }).join(',');
  });
  const csv = [header].concat(rows).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'landa_cases.csv';
  a.click();
}

// ===== Modal helpers =====
function openModal(){ document.getElementById('modalBack').style.display='flex'; }
function closeModal(){ document.getElementById('modalBack').style.display='none'; }

// expose some functions globally for other files
window.go          = go;
window.getCases    = getCases;
window.setCases    = setCases;
window.updateKPIs  = updateKPIs;
window.toast       = toast;
window.openModal   = openModal;
window.closeModal  = closeModal;
window.esc         = esc;
window.nl          = nl;
window.exportCSV   = exportCSV;

// ===== Particles background =====
(function(){
  const c=document.getElementById('particles');
  if(!c) return;
  const ctx=c.getContext('2d');
  let w,h;
  function resize(){ w=c.width=innerWidth; h=c.height=innerHeight; }
  addEventListener('resize',resize);
  resize();
  const dots=Array.from({length:60},()=>({
    x:Math.random()*w,
    y:Math.random()*h,
    r:Math.random()*1.6+0.6,
    vx:(Math.random()-.5)*0.28,
    vy:(Math.random()-.5)*0.28
  }));
  function step(){
    ctx.clearRect(0,0,w,h);
    for(const d of dots){
      d.x+=d.vx; d.y+=d.vy;
      if(d.x<0||d.x>w) d.vx*=-1;
      if(d.y<0||d.y>h) d.vy*=-1;
      ctx.beginPath();
      ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
      ctx.fillStyle='rgba(59,208,255,0.25)';
      ctx.fill();
    }
    requestAnimationFrame(step);
  }
  step();
})();

// default initial KPIs when app loads directly
updateKPIs();
