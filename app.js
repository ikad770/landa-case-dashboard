// app.js – auth, routing, form logic, particles

const AUTH_KEY = 'landaAuth';

// small helpers
function toast(msg, type='ok'){
  const wrap = document.getElementById('toasts');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(), 250); }, 1600);
}

// particles
(function(){
  const c = document.getElementById('particles');
  if (!c) return;
  const ctx = c.getContext('2d');
  let w,h;
  function resize(){ w=c.width=innerWidth; h=c.height=innerHeight; }
  window.addEventListener('resize', resize);
  resize();
  const dots = Array.from({length:60},()=>({
    x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.6+0.6,
    vx:(Math.random()-.5)*0.28,vy:(Math.random()-.5)*0.28
  }));
  function step(){
    ctx.clearRect(0,0,w,h);
    for(const d of dots){
      d.x+=d.vx; d.y+=d.vy;
      if(d.x<0||d.x>w) d.vx*=-1;
      if(d.y<0||d.y>h) d.vy*=-1;
      ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
      ctx.fillStyle='rgba(59,208,255,0.25)'; ctx.fill();
    }
    requestAnimationFrame(step);
  }
  step();
})();

// dropdown engine
function makeDropdown(container, { placeholder='Choose…', options=[], onChange=()=>{}, maxHeight=260 }){
  container.classList.add('dd');
  container.innerHTML = `
    <button type="button" class="dd-btn">
      <span class="dd-label">${placeholder}</span>
      <span class="dd-arrow" aria-hidden="true"></span>
    </button>
    <div class="dd-list" style="max-height:${maxHeight}px"></div>
    <input type="hidden" class="dd-value" value="">
  `;
  const btn = container.querySelector('.dd-btn');
  const list = container.querySelector('.dd-list');
  const label = container.querySelector('.dd-label');
  const input = container.querySelector('.dd-value');

  let state = { open:false, opts:options, index:-1 };

  function render(){
    list.innerHTML = '';
    if (!state.opts.length) {
      list.innerHTML = `<div class="dd-empty">No options</div>`;
      return;
    }
    state.opts.forEach((o,i)=>{
      const it = document.createElement('div');
      it.className = 'dd-item';
      it.dataset.value = o.value;
      if (String(input.value) === String(o.value)) it.setAttribute('aria-selected','true');
      it.textContent = o.label ?? o.value;
      it.addEventListener('click', ()=> selectIndex(i));
      list.appendChild(it);
    });
  }

  function open(){
    container.classList.add('open');
    state.open = true;
    window.addEventListener('click', outside);
  }
  function close(){
    container.classList.remove('open');
    state.open = false;
    window.removeEventListener('click', outside);
  }
  function outside(e){
    if (!container.contains(e.target)) close();
  }
  function selectIndex(i){
    const o = state.opts[i];
    if (!o) return;
    input.value = o.value;
    label.textContent = o.label ?? o.value;
    [...list.children].forEach(c=>c.removeAttribute('aria-selected'));
    if (list.children[i]) list.children[i].setAttribute('aria-selected','true');
    close();
    onChange(o.value, o.label ?? o.value);
  }

  btn.addEventListener('click', ()=> state.open ? close() : open());

  const api = {
    setOptions(newOpts){
      state.opts = newOpts || [];
      render();
      if (!state.opts.some(o => String(o.value) === String(input.value))) {
        input.value = '';
        label.textContent = placeholder;
      }
    },
    setValue(v){
      const idx = state.opts.findIndex(o=>String(o.value)===String(v));
      if (idx >= 0) selectIndex(idx);
      else { input.value=''; label.textContent = placeholder; }
    },
    value(){ return input.value; }
  };

  render();
  return api;
}

// Press list – mapping (אתה יכול לעדכן שמות לקוחות כאן)
const PRESS_BOOK = {
  Simplex: [
    { value:'S1', label:'S1' },
    { value:'S2', label:'S2' },
    { value:'S3', label:'S3' },
    { value:'S4', label:'S4' },
    { value:'S5', label:'S5' },
    { value:'S6', label:'S6' },
    { value:'S7', label:'S7' },
    { value:'S8', label:'S8' },
    { value:'S9', label:'S9' }
  ],
  Duplex: Array.from({length:19},(_,i)=>({value:`D${i+1}`,label:`D${i+1}`}))
};

// System hierarchy (אפשר להרחיב בהמשך)
const HIER = {
  'BSS': {
    subSystems: ['LIB','BCU','BCD & BTD Motors','BACS','Fly-Off','Air Knife','Hot Plate','Dancer','BCLS','Vacuum Box'],
    categories: {
      'HW': ['Rollers','Sensors','Motors','Valves','Encoders','Spare Parts'],
      'SW': ['LIA','RTC','OPC','Parameters'],
      'EC': ['Inverters','Cables','SSR','CBs','FECs']
    }
  },
  'IRD': {
    subSystems: ['IRD Zone 1','IRD Zone 2','IRD Zone 3','IRD Zone 4'],
    categories: {
      'Temp': ['Set point','Feedback'],
      'Power': ['Power level'],
      'Air': ['Air knife','Exhaust']
    }
  }
};

function initApp(){
  const loginPage = document.getElementById('loginPage');
  const appRoot   = document.getElementById('appRoot');

  function showApp(){
    if (loginPage) loginPage.classList.add('hidden');
    if (appRoot) appRoot.classList.remove('hidden');
    go('dashboard');
    if (typeof updateKPIsFromCases === 'function') updateKPIsFromCases();
  }
  function showLogin(){
    if (appRoot) appRoot.classList.add('hidden');
    if (loginPage) loginPage.classList.remove('hidden');
  }

  // auth
  const btnLogin = document.getElementById('btnLogin');
  if (btnLogin) btnLogin.addEventListener('click', ()=>{
    const u = document.getElementById('authUser')?.value.trim();
    const p = document.getElementById('authPass')?.value.trim();
    if (u === 'Expert' && p === 'Landa123456') {
      localStorage.setItem(AUTH_KEY,'true');
      toast('Welcome, Expert','ok');
      showApp();
    } else {
      toast('Invalid credentials','err');
    }
  });

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) btnLogout.addEventListener('click', (e)=>{
    e.preventDefault();
    localStorage.removeItem(AUTH_KEY);
    toast('Logged out','ok');
    showLogin();
  });

  if (localStorage.getItem(AUTH_KEY) === 'true') {
    showApp();
  } else {
    showLogin();
  }

  // nav routing
  document.querySelectorAll('.nav .item').forEach(a=>{
    const route = a.getAttribute('data-route');
    if (!route) return;
    a.addEventListener('click', e=>{
      e.preventDefault();
      go(route);
      document.body.classList.remove('aside-open');
    });
  });

  const logoHome = document.getElementById('logoHome');
  if (logoHome) logoHome.addEventListener('click', ()=> go('dashboard'));

  const btnMenu = document.getElementById('btnMenu');
  if (btnMenu) btnMenu.addEventListener('click', ()=>{
    document.body.classList.toggle('aside-open');
  });

  // form logic
  setupPressDropdown();
  setupSystemDropdowns();
  setupTFS();
  setupSteps();
  setupPartSuggest();
  setupFiles();
  setupSolutionMeta();

  // RCA wizard init once
  if (typeof initRCA === 'function') initRCA();

  // initial KPIs & cases view
  if (typeof updateKPIsFromCases === 'function') updateKPIsFromCases();
}

// Routing
const PAGES = ['dashboard','create','cases','diagnosis','settings'];
function go(route){
  PAGES.forEach(p=>{
    const sec = document.getElementById('page-'+p);
    if (!sec) return;
    sec.classList.toggle('hidden', p !== route);
  });
  document.querySelectorAll('.nav .item').forEach(a=>{
    const r = a.getAttribute('data-route');
    a.classList.toggle('active', r === route);
  });
  const fab = document.getElementById('fabNew');
  if (fab) fab.style.display = route === 'create' ? 'none' : 'block';

  if (route === 'dashboard' && typeof updateKPIsFromCases === 'function') {
    updateKPIsFromCases();
  }
  if (route === 'cases' && typeof renderCases === 'function') {
    renderCases();
  }
}
window.go = go;

// Form: press type/name
let ddPress;
function setupPressDropdown(){
  const chipsWrap = document.getElementById('pressTypeChips');
  const hiddenType = document.getElementById('pressType');
  const ddContainer = document.getElementById('dd-press');
  if (!chipsWrap || !hiddenType || !ddContainer) return;

  ddPress = makeDropdown(ddContainer, {
    placeholder:'Choose press…',
    options: PRESS_BOOK[hiddenType.value] || []
  });

  function fill(type){
    const opts = PRESS_BOOK[type] || [];
    ddPress.setOptions(opts);
    ddPress.setValue('');
  }
  fill(hiddenType.value || 'Simplex');

  chipsWrap.addEventListener('click', e=>{
    const chip = e.target.closest('.chip');
    if (!chip) return;
    chipsWrap.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    const type = chip.dataset.type;
    hiddenType.value = type;
    fill(type);
  });
}

// Form: system hierarchy
let ddSystem, ddSub, ddCat, ddItem;
function setupSystemDropdowns(){
  const elSystem = document.getElementById('dd-system');
  const elSub    = document.getElementById('dd-sub');
  const elCat    = document.getElementById('dd-cat');
  const elItem   = document.getElementById('dd-item');
  const wrapSub  = document.getElementById('wrap-sub');
  const wrapCat  = document.getElementById('wrap-cat');
  const wrapItem = document.getElementById('wrap-item');

  if (!elSystem || !elSub || !elCat || !elItem) return;

  ddSystem = makeDropdown(elSystem, {
    placeholder:'Select system…',
    options: Object.keys(HIER).map(k=>({value:k,label:k})),
    onChange:(val)=>onSystemChange(val)
  });
  ddSub = makeDropdown(elSub, {
    placeholder:'Select sub-system…',
    options:[],
    onChange:()=>onSubChange()
  });
  ddCat = makeDropdown(elCat, {
    placeholder:'Select category…',
    options:[],
    onChange:(val)=>onCatChange(val)
  });
  ddItem = makeDropdown(elItem, {
    placeholder:'Select item…',
    options:[]
  });

  function onSystemChange(val){
    if (wrapSub) wrapSub.classList.add('hidden');
    if (wrapCat) wrapCat.classList.add('hidden');
    if (wrapItem) wrapItem.classList.add('hidden');
    ddSub.setOptions([]); ddSub.setValue('');
    ddCat.setOptions([]); ddCat.setValue('');
    ddItem.setOptions([]); ddItem.setValue('');

    const node = HIER[val];
    if (!node) return;
    ddSub.setOptions(node.subSystems.map(s=>({value:s,label:s})));
    if (wrapSub) wrapSub.classList.remove('hidden');
  }
  function onSubChange(){
    if (wrapCat) wrapCat.classList.add('hidden');
    if (wrapItem) wrapItem.classList.add('hidden');
    ddCat.setOptions([]); ddCat.setValue('');
    ddItem.setOptions([]); ddItem.setValue('');

    const sys = ddSystem.value();
    if (!sys || !HIER[sys]) return;
    const cats = Object.keys(HIER[sys].categories || {});
    ddCat.setOptions(cats.map(c=>({value:c,label:c})));
    if (wrapCat) wrapCat.classList.remove('hidden');
  }
  function onCatChange(catVal){
    if (wrapItem) wrapItem.classList.add('hidden');
    ddItem.setOptions([]); ddItem.setValue('');
    const sys = ddSystem.value();
    if (!sys || !catVal) return;
    const items = (HIER[sys].categories[catVal] || []).map(x=>({value:x,label:x}));
    ddItem.setOptions(items);
    if (wrapItem) wrapItem.classList.remove('hidden');
  }
}

// TFS toggle
function setupTFS(){
  const tfsToggle = document.getElementById('tfsToggle');
  const tfsNumber = document.getElementById('tfsNumber');
  if (!tfsToggle || !tfsNumber) return;
  tfsToggle.addEventListener('change', ()=>{
    if (tfsToggle.checked){
      tfsNumber.classList.remove('hidden');
      tfsNumber.focus();
    } else {
      tfsNumber.classList.add('hidden');
      tfsNumber.value = '';
    }
  });
}

// Steps
function setupSteps(){
  const tsSteps = document.getElementById('tsSteps');
  if (!tsSteps) return;
  function add(val=''){
    const row = document.createElement('div');
    row.className = 'inline';
    row.style.margin = '4px 0';
    const inp = document.createElement('input');
    inp.className = 'input field-wide';
    inp.placeholder = 'Describe a step…';
    inp.value = val;
    const rm = document.createElement('button');
    rm.type='button'; rm.className='btn small danger'; rm.textContent='Remove';
    rm.addEventListener('click', ()=>row.remove());
    row.appendChild(inp); row.appendChild(rm);
    tsSteps.appendChild(row);
  }
  window.addStep = add;
  add('Check connections and sensors');
  add('Verify model-specific settings');
}

// Part suggest (demo)
function setupPartSuggest(){
  const input = document.getElementById('partInput');
  const box = document.getElementById('partSuggest');
  if (!input || !box) return;
  const parts = Array.from({length:160},(_,i)=> ((i%2===0)?'12':'34') + '-' + String(10000+i).slice(-5));

  function filter(q){
    const v = String(q||'').trim().toLowerCase();
    if (!v) return [];
    return parts.filter(p=>p.toLowerCase().includes(v)).slice(0,30);
  }

  input.addEventListener('input', ()=>{
    const list = filter(input.value);
    box.innerHTML = '';
    if (!list.length){
      box.style.display='none'; return;
    }
    list.forEach(p=>{
      const row = document.createElement('div');
      row.textContent = p;
      row.addEventListener('click', ()=>{
        input.value = p;
        box.style.display='none';
      });
      box.appendChild(row);
    });
    box.style.display='block';
  });
  document.addEventListener('click', e=>{
    if (!box.contains(e.target) && e.target !== input){
      box.style.display='none';
    }
  });
}

// Files
function setupFiles(){
  const wrap = document.getElementById('filesWrap');
  if (!wrap) return;
  function addRow(){
    const row = document.createElement('div');
    row.className = 'inline';
    const inp = document.createElement('input');
    inp.type='file';
    inp.className='file';
    inp.accept='.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip';
    const rm = document.createElement('button');
    rm.type='button'; rm.className='btn small danger'; rm.textContent='Remove';
    rm.addEventListener('click', ()=>row.remove());
    row.appendChild(inp); row.appendChild(rm);
    wrap.appendChild(row);
  }
  window.addFileRow = addRow;
  addRow();
}

// Solution meta
function setupSolutionMeta(){
  const cb = document.getElementById('solVersionDependent');
  const wrap = document.getElementById('solVersionWrap');
  if (!cb || !wrap) return;
  cb.addEventListener('change', ()=>{
    wrap.classList.toggle('hidden', !cb.checked);
  });
}

// Collect steps
function collectSteps(){
  const tsSteps = document.getElementById('tsSteps');
  if (!tsSteps) return '';
  return [...tsSteps.querySelectorAll('.inline input')]
    .map(i=>i.value)
    .filter(v=>String(v).trim())
    .join('\n');
}

// Save case
async function saveCase(e){
  e.preventDefault();
  const req = v => v && String(v).trim().length > 0;

  const pressType = document.getElementById('pressType')?.value || '';
  const pressName = ddPress ? ddPress.value() : '';

  const data = {
    sfCase: document.getElementById('sfCase')?.value.trim() || '',
    pressType,
    pressName,
    softwareVersion: document.getElementById('softwareVersion')?.value.trim() || '',
    tfsNumber: document.getElementById('tfsToggle')?.checked ? (document.getElementById('tfsNumber')?.value.trim() || '') : '',
    system: ddSystem ? ddSystem.value() : '',
    subSystem: ddSub ? ddSub.value() : '',
    category: ddCat ? ddCat.value() : '',
    item: ddItem ? ddItem.value() : '',
    issueSummary: document.getElementById('issueSummary')?.value.trim() || '',
    symptoms: document.getElementById('symptoms')?.value.trim() || '',
    troubleshooting: collectSteps(),
    partIssue: document.getElementById('partInput')?.value.trim() || '',
    solution: document.getElementById('solution')?.value.trim() || '',
    solutionSWDependent: !!document.getElementById('solVersionDependent')?.checked,
    solutionSWVersions: document.getElementById('solVersionText')?.value.trim() || '',
    verification: document.getElementById('verification')?.value.trim() || '',
    notes: document.getElementById('notes')?.value.trim() || '',
    attachments: [],
    createdAt: new Date().toISOString()
  };

  // validation
  if (!req(data.sfCase))         return toast('SF Case is required','err');
  if (!req(pressName))           return toast('Please select a Press Name','err');
  if (!req(data.system))         return toast('System is required','err');
  if (!req(data.subSystem))      return toast('Sub-System is required','err');
  if (!req(data.category))       return toast('Category is required','err');
  if (!req(data.item))           return toast('Item is required','err');
  if (!req(data.issueSummary))   return toast('Issue Summary is required','err');
  if (!req(data.solution))       return toast('Final Solution is required','err');

  // attachments
  const fileInputs = [...document.querySelectorAll('#filesWrap input[type="file"]')];
  for (const inp of fileInputs){
    const f = inp.files && inp.files[0];
    if (!f) continue;
    const ok = /\.(pdf|docx?|xlsx?|png|jpe?g|zip)$/i.test(f.name);
    if (!ok){
      toast('Unsupported file: '+f.name,'err');
      continue;
    }
    const base64 = await new Promise(res=>{
      const r = new FileReader();
      r.onload = ()=>res(r.result);
      r.readAsDataURL(f);
    });
    data.attachments.push({name:f.name,type:f.type,data:base64});
  }

  const arr = getCases();
  arr.push(data);
  setCases(arr);

  // reset form
  const form = document.getElementById('caseForm');
  if (form) form.reset();

  // reset press type & dropdown
  const chipsWrap = document.getElementById('pressTypeChips');
  const hiddenType = document.getElementById('pressType');
  if (chipsWrap && hiddenType){
    chipsWrap.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
    const def = chipsWrap.querySelector('[data-type="Simplex"]');
    if (def) def.classList.add('active');
    hiddenType.value = 'Simplex';
    if (ddPress){
      ddPress.setOptions(PRESS_BOOK['Simplex']);
      ddPress.setValue('');
    }
  }

  // reset hierarchy
  if (ddSystem) ddSystem.setValue('');
  if (ddSub) { ddSub.setOptions([]); ddSub.setValue(''); }
  if (ddCat) { ddCat.setOptions([]); ddCat.setValue(''); }
  if (ddItem){ ddItem.setOptions([]); ddItem.setValue(''); }
  const wrapSub  = document.getElementById('wrap-sub');
  const wrapCat  = document.getElementById('wrap-cat');
  const wrapItem = document.getElementById('wrap-item');
  if (wrapSub) wrapSub.classList.add('hidden');
  if (wrapCat) wrapCat.classList.add('hidden');
  if (wrapItem) wrapItem.classList.add('hidden');

  // reset files
  const filesWrap = document.getElementById('filesWrap');
  if (filesWrap){
    filesWrap.innerHTML = '';
    if (typeof addFileRow === 'function') addFileRow();
  }

  // reset steps
  const tsSteps = document.getElementById('tsSteps');
  if (tsSteps){
    tsSteps.innerHTML = '';
    if (typeof addStep === 'function'){
      addStep('Check connections and sensors');
      addStep('Verify model-specific settings');
    }
  }

  if (typeof updateKPIsFromCases === 'function') updateKPIsFromCases();
  toast('Case saved successfully','ok');
  go('cases');
}
window.saveCase = saveCase;

// init
initApp();
