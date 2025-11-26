/* ===== Helpers ===== */
function toast(msg,type='ok'){
  const wrap = document.getElementById('toasts'); if(!wrap) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(),260); },1600);
}
function esc(s){ return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

const LS_KEY_CASES = 'landa_cases_v20';
const LS_KEY_AUTH  = 'landaAuth_v20';
const LS_KEY_THEME = 'landaTheme_v20';
const LS_KEY_DENS  = 'landaDensity_v20';

/* ===== Storage ===== */
function getCases(){
  try{ return JSON.parse(localStorage.getItem(LS_KEY_CASES)||'[]'); }
  catch(e){ return []; }
}
function setCases(arr){
  localStorage.setItem(LS_KEY_CASES, JSON.stringify(arr));
  updateKPIs();
  const countEl = document.getElementById('casesCount');
  if(countEl) countEl.textContent = arr.length;
}
function getCaseById(id){ return getCases().find(c=>c.id===id); }
function upsertCase(c){
  const arr = getCases();
  const idx = arr.findIndex(x=>x.id===c.id);
  if(idx>=0) arr[idx]=c; else arr.push(c);
  setCases(arr);
}

/* ===== Routing ===== */
const pages = ['dashboard','create','cases','diagnosis','settings'];

function go(route){
  pages.forEach(p=>{
    const el=document.getElementById('page-'+p);
    if(el) el.classList.add('hidden');
  });
  const tgt=document.getElementById('page-'+route);
  if(tgt) tgt.classList.remove('hidden');

  document.querySelectorAll('.nav .item').forEach(a=>{
    const r=a.getAttribute('data-route');
    a.classList.toggle('active', r===route);
  });

  if(route==='dashboard') updateKPIs();
  if(route==='cases' && window.renderAllCases) window.renderAllCases();
  if(route==='diagnosis' && window.renderRCA) window.renderRCA();

  window.scrollTo({top:0,behavior:'smooth'});
}
document.getElementById('logoHome')?.addEventListener('click',()=>go('dashboard'));
document.querySelectorAll('.nav .item').forEach(a=>{
  const r=a.getAttribute('data-route');
  if(!r) return;
  a.addEventListener('click',e=>{ e.preventDefault(); go(r); });
});
document.getElementById('btnNavCreateCase')?.addEventListener('click',()=>go('create'));

/* ===== Auth ===== */
const loginPage = document.getElementById('loginPage');
const appRoot   = document.getElementById('appRoot');
const authUser  = document.getElementById('authUser');
const authPass  = document.getElementById('authPass');

function showApp(){ loginPage.classList.add('hidden'); appRoot.classList.remove('hidden'); go('dashboard'); updateKPIs(); }
function showLogin(){ appRoot.classList.add('hidden'); loginPage.classList.remove('hidden'); }

function attemptLogin(){
  const u=(authUser?.value||'').trim();
  const p=(authPass?.value||'').trim();
  if(u==='Expert' && p==='Landa123456'){
    toast('Welcome, Expert','ok');
    localStorage.setItem(LS_KEY_AUTH,'true');
    setTimeout(showApp,450);
  }else{
    toast('Invalid credentials','err');
  }
}
document.getElementById('btnLogin')?.addEventListener('click',attemptLogin);
[authUser,authPass].forEach(el=>{
  el?.addEventListener('keydown',e=>{
    if(e.key==='Enter'){ e.preventDefault(); attemptLogin(); }
  });
});
document.getElementById('btnLogout')?.addEventListener('click',e=>{
  e.preventDefault();
  toast('Logged out','ok');
  localStorage.removeItem(LS_KEY_AUTH);
  setTimeout(showLogin,400);
});

if(localStorage.getItem(LS_KEY_AUTH)==='true') showApp();

/* ===== Theme & Density ===== */
function applyThemeFromStorage(){
  const t = localStorage.getItem(LS_KEY_THEME)||'dark';
  if(t==='light') document.body.classList.add('light');
  else document.body.classList.remove('light');
}
function toggleTheme(){
  const isLight=document.body.classList.toggle('light');
  localStorage.setItem(LS_KEY_THEME, isLight?'light':'dark');
}
document.getElementById('btnToggleTheme')?.addEventListener('click',toggleTheme);

function applyDensityFromStorage(){
  const d = localStorage.getItem(LS_KEY_DENS)||'normal';
  if(d==='compact') document.body.classList.add('compact');
  else document.body.classList.remove('compact');
}
function toggleDensity(){
  const isCompact=document.body.classList.toggle('compact');
  localStorage.setItem(LS_KEY_DENS, isCompact?'compact':'normal');
}
document.getElementById('btnToggleDensity')?.addEventListener('click',toggleDensity);
applyThemeFromStorage();
applyDensityFromStorage();

/* ===== Particles background ===== */
(function(){
  const c=document.getElementById('particles'); if(!c) return;
  const ctx=c.getContext('2d');
  let w=window.innerWidth,h=window.innerHeight;
  c.width=w; c.height=h;
  const ps=[];
  for(let i=0;i<60;i++){
    ps.push({
      x:Math.random()*w,
      y:Math.random()*h,
      r:Math.random()*2+0.6,
      dx:(Math.random()-0.5)*0.25,
      dy:(Math.random()-0.5)*0.25,
      o:0.15+Math.random()*0.25
    });
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    ps.forEach(p=>{
      p.x+=p.dx; p.y+=p.dy;
      if(p.x<0)p.x=w; if(p.x>w)p.x=0;
      if(p.y<0)p.y=h; if(p.y>h)p.y=0;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(0,174,239,${p.o})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener('resize',()=>{
    w=window.innerWidth; h=window.innerHeight; c.width=w; c.height=h;
  });
})();

/* ===== Generic dropdown engine ===== */
function makeDropdown(container,{placeholder='Choose…',options=[],onChange=()=>{}}){
  container.classList.add('dd');
  container.innerHTML = `
    <button type="button" class="dd-btn"><span class="dd-label">${placeholder}</span></button>
    <span class="dd-arrow" aria-hidden="true"></span>
    <div class="dd-list"></div>
    <input type="hidden" class="dd-value" value="">
  `;
  const btn   = container.querySelector('.dd-btn');
  const list  = container.querySelector('.dd-list');
  const label = container.querySelector('.dd-label');
  const input = container.querySelector('.dd-value');
  let state   = { opts: options.slice() };

  function render(){
    list.innerHTML='';
    if(!state.opts.length){
      list.innerHTML=`<div class="dd-empty">No options</div>`;
      return;
    }
    state.opts.forEach((o,i)=>{
      const it=document.createElement('div');
      it.className='dd-item';
      it.dataset.value=o.value;
      it.dataset.index=i;
      if(String(input.value)===String(o.value)) it.setAttribute('aria-selected','true');
      it.textContent=o.label ?? o.value;
      it.addEventListener('click',()=>selectIndex(i));
      list.appendChild(it);
    });
  }
  function selectIndex(i){
    const o=state.opts[i]; if(!o) return;
    input.value=o.value;
    label.textContent=o.label ?? o.value;
    onChange(o.value,o);
    container.classList.remove('open');
  }
  btn.addEventListener('click',()=>{
    container.classList.toggle('open');
    if(container.classList.contains('open')) render();
  });
  document.addEventListener('click',e=>{
    if(!container.contains(e.target)) container.classList.remove('open');
  });

  render();
  return {
    setOptions(newOpts){ state.opts=newOpts.slice(); render(); },
    setValue(val){
      input.value=val;
      const o=state.opts.find(o=>String(o.value)===String(val));
      label.textContent=o ? (o.label ?? o.value) : placeholder;
    },
    get value(){ return input.value; }
  };
}

/* ===== Press options from PRESS_NAMES (Simplex/Duplex) ===== */
function getPressOptions(kind){
  const map = (window.PRESS_NAMES && window.PRESS_NAMES[kind]) || {};
  return Object.entries(map).map(([code,name])=>({
    value: code,
    label: `${code} – ${name}`
  }));
}

/* ===== System hierarchy helpers ===== */
function getSystemOptions(){
  return (window.SYSTEM_OPTIONS || []).slice();
}
function getSubSystems(system){
  const h = window.SYSTEM_HIER || {};
  return (h[system]?.subSystems || []).map(x=>({value:x,label:x}));
}
function getHwSwEcOptions(system){
  const h=window.SYSTEM_HIER || {};
  const cats=h[system]?.categories || {};
  return ['HW','SW','EC'].filter(k=>cats[k]).map(k=>({value:k,label:k}));
}
function getAreaOptions(system, cat){
  const h=window.SYSTEM_HIER || {};
  const areas=h[system]?.areas || [];
  return areas.map(a=>({value:a,label:a}));
}

/* ===== Create Case form init ===== */
let ddPress, ddRegion, ddSystem, ddSubSystem, ddHwSwEc, ddArea, ddPart;
let tsStepsState = [];
let attachmentsState = [];
let partsSelected = [];

function initCreateCaseForm(){
  const form=document.getElementById('caseForm'); if(!form) return;

  // Press Type chips
  const seg = document.getElementById('segPressType');
  const hiddenType=document.getElementById('pressType');
  seg.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      seg.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      hiddenType.value=btn.dataset.value;
      if(ddPress){
        ddPress.setOptions(getPressOptions(hiddenType.value));
        ddPress.setValue('');
      }
    });
  });

  // Press dropdown
  ddPress = makeDropdown(document.getElementById('dd-press'),{
    placeholder:'Select press',
    options:getPressOptions(hiddenType.value)
  });

  // Region dropdown
  ddRegion = makeDropdown(document.getElementById('dd-region'),{
    placeholder:'Region',
    options:[
      {value:'NA', label:'North America'},
      {value:'EU', label:'Europe'},
      {value:'APJ',label:'APJ'},
      {value:'IL', label:'Israel'},
      {value:'Other', label:'Other'}
    ]
  });

  // System chain
  ddSystem = makeDropdown(document.getElementById('dd-system'),{
    placeholder:'System',
    options:getSystemOptions(),
    onChange:(val)=>{
      ddSubSystem.setOptions(getSubSystems(val));
      ddSubSystem.setValue('');
      ddHwSwEc.setOptions(getHwSwEcOptions(val));
      ddHwSwEc.setValue('');
      ddArea.setOptions(getAreaOptions(val));
      ddArea.setValue('');
    }
  });
  ddSubSystem = makeDropdown(document.getElementById('dd-subsystem'),{
    placeholder:'Sub System',
    options:[]
  });
  ddHwSwEc = makeDropdown(document.getElementById('dd-hw-sw-ec'),{
    placeholder:'HW / SW / EC',
    options:[]
  });
  ddArea = makeDropdown(document.getElementById('dd-area'),{
    placeholder:'Area',
    options:[]
  });

  // Troubleshooting steps
  const tsContainer=document.getElementById('tsSteps');
  const btnAddStep=document.getElementById('btnAddStep');
  function renderSteps(){
    tsContainer.innerHTML='';
    tsStepsState.forEach((t,idx)=>{
      const row=document.createElement('div');
      row.className='ts-step-row';
      row.innerHTML=`
        <textarea class="input v13" rows="2" data-idx="${idx}" placeholder="Action taken…">${esc(t)}</textarea>
        <button type="button" class="btn small ts-remove" data-idx="${idx}">×</button>
      `;
      tsContainer.appendChild(row);
    });
    tsContainer.querySelectorAll('textarea').forEach(ta=>{
      ta.addEventListener('input',()=>{
        const i=Number(ta.dataset.idx);
        tsStepsState[i]=ta.value;
      });
    });
    tsContainer.querySelectorAll('.ts-remove').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const i=Number(btn.dataset.idx);
        tsStepsState.splice(i,1);
        renderSteps();
      });
    });
  }
  btnAddStep.addEventListener('click',()=>{ tsStepsState.push(''); renderSteps(); });

  // Attachments
  const attachList=document.getElementById('attachList');
  const attachInput=document.getElementById('attachInput');
  const btnAddAttachment=document.getElementById('btnAddAttachment');

  function renderAttachments(){
    attachList.innerHTML='';
    attachmentsState.forEach((a,idx)=>{
      const pill=document.createElement('div');
      pill.className='attach-pill';
      pill.innerHTML=`
        <span>${esc(a)}</span>
        <button type="button" data-idx="${idx}" data-act="preview">👁</button>
        <button type="button" data-idx="${idx}" data-act="remove">×</button>
      `;
      attachList.appendChild(pill);
    });
    attachList.querySelectorAll('button').forEach(btn=>{
      const idx=Number(btn.dataset.idx);
      const act=btn.dataset.act;
      btn.addEventListener('click',()=>{
        const val=attachmentsState[idx];
        if(act==='remove'){
          attachmentsState.splice(idx,1);
          renderAttachments();
        }else if(act==='preview' && val){
          if(/^https?:\/\//i.test(val)) window.open(val,'_blank');
          else alert('Attachment: '+val);
        }
      });
    });
  }
  btnAddAttachment.addEventListener('click',()=>{
    const v=(attachInput.value||'').trim();
    if(!v) return;
    attachmentsState.push(v);
    attachInput.value='';
    renderAttachments();
  });

  // Parts – from window.PARTS
  const partDesc=document.getElementById('partDesc');
  const partList=document.getElementById('partList');

  function getPartOptions(){
    const arr = (window.PARTS || []);
    return arr.map(p=>({
      value:p.item,
      label:`${p.item} – ${p.description}`
    }));
  }
  ddPart = makeDropdown(document.getElementById('dd-part'),{
    placeholder:'Select part',
    options:getPartOptions(),
    onChange:(val)=>{
      const p=(window.PARTS||[]).find(x=>x.item===val);
      partDesc.textContent = p ? p.description : '';
    }
  });

  function renderPartList(){
    partList.innerHTML='';
    partsSelected.forEach((p,idx)=>{
      const chip=document.createElement('div');
      chip.className='part-chip';
      chip.innerHTML=`
        <b>${esc(p.item)}</b>
        <span>${esc(p.description)}</span>
        <button type="button" data-idx="${idx}">×</button>
      `;
      partList.appendChild(chip);
    });
    partList.querySelectorAll('button').forEach(btn=>{
      const idx=Number(btn.dataset.idx);
      btn.addEventListener('click',()=>{
        partsSelected.splice(idx,1);
        renderPartList();
      });
    });
  }

  // הוספת part בלחיצה על Enter או בחירה + כפתור
  document.getElementById('dd-part').addEventListener('dblclick',()=>{
    const code = ddPart.value;
    const p=(window.PARTS||[]).find(x=>x.item===code);
    if(!p) return;
    if(!partsSelected.find(x=>x.item===p.item)){
      partsSelected.push({...p});
      renderPartList();
    }
  });

  // Reset
  function resetForm(){
    form.reset();
    document.getElementById('pressType').value='Simplex';
    seg.querySelectorAll('button').forEach(btn=>{
      btn.classList.toggle('active',btn.dataset.value==='Simplex');
    });
    ddPress.setOptions(getPressOptions('Simplex'));
    ddPress.setValue('');
    ddRegion.setValue('');
    ddSystem.setValue('');
    ddSubSystem.setValue('');
    ddHwSwEc.setValue('');
    ddArea.setValue('');
    tsStepsState=[];
    attachmentsState=[];
    partsSelected=[];
    tsContainer.innerHTML='';
    attachList.innerHTML='';
    partList.innerHTML='';
    partDesc.textContent='';
  }
  document.getElementById('btnResetCaseForm')?.addEventListener('click',()=>{ window.currentEditId=null; resetForm(); });

  // Save
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const sfCase=(document.getElementById('sfCase').value||'').trim();
    const subject=(document.getElementById('subject').value||'').trim();
    const description=(document.getElementById('description').value||'').trim();
    if(!sfCase || !subject || !description){
      toast('Please fill SF Case, Subject & Description','err');
      return;
    }
    const now=(new Date()).toISOString().slice(0,10);
    const id = window.currentEditId || Date.now();

    const c = {
      id,
      sfCase,
      pressType: document.getElementById('pressType').value,
      press: ddPress.value || '',
      system: ddSystem.value || '',
      subSystem: ddSubSystem.value || '',
      hwSwEc: ddHwSwEc.value || '',
      area: ddArea.value || '',
      subject,
      description,
      caseDate: document.getElementById('caseDate').value || now,
      region: ddRegion.value || '',
      owner: (document.getElementById('owner').value||'').trim(),
      tags: (document.getElementById('tags').value||'').trim(),
      notes: (document.getElementById('notes').value||'').trim(),
      troubleshooting: tsStepsState.slice(),
      attachments: attachmentsState.slice(),
      parts: partsSelected.slice()
    };

    upsertCase(c);
    window.currentEditId=null;
    toast('Case saved','ok');
    resetForm();
  });

  window.resetCaseForm = resetForm;
}
initCreateCaseForm();

/* ===== Edit from All Cases (js/cases.js יקרא לפה) ===== */
window.editCaseFromList = function(id){
  const c=getCaseById(id); if(!c) return;
  window.currentEditId=id;
  go('create');

  document.getElementById('sfCase').value = c.sfCase || '';
  document.getElementById('pressType').value = c.pressType || 'Simplex';

  const seg=document.getElementById('segPressType');
  seg.querySelectorAll('button').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.value===document.getElementById('pressType').value);
  });

  ddPress.setOptions(getPressOptions(c.pressType||'Simplex'));
  if(c.press) ddPress.setValue(c.press);

  ddSystem.setValue(c.system || '');
  ddSubSystem.setOptions(getSubSystems(c.system||''));
  ddSubSystem.setValue(c.subSystem || '');
  ddHwSwEc.setOptions(getHwSwEcOptions(c.system||''));
  ddHwSwEc.setValue(c.hwSwEc || '');
  ddArea.setOptions(getAreaOptions(c.system||'',c.hwSwEc||''));
  ddArea.setValue(c.area || '');

  document.getElementById('subject').value = c.subject || '';
  document.getElementById('description').value = c.description || '';
  document.getElementById('caseDate').value = c.caseDate || '';
  ddRegion.setValue(c.region || '');
  document.getElementById('owner').value = c.owner || '';
  document.getElementById('tags').value = c.tags || '';
  document.getElementById('notes').value = c.notes || '';

  tsStepsState = (c.troubleshooting||[]).slice();
  attachmentsState = (c.attachments||[]).slice();
  partsSelected = (c.parts||[]).slice();

  // רנדר מחדש
  const tsContainer=document.getElementById('tsSteps');
  const attachList=document.getElementById('attachList');
  const partList=document.getElementById('partList');
  // steps
  (function renderSteps(){
    tsContainer.innerHTML='';
    tsStepsState.forEach((t,idx)=>{
      const row=document.createElement('div');
      row.className='ts-step-row';
      row.innerHTML=`
        <textarea class="input v13" rows="2" data-idx="${idx}" placeholder="Action taken…">${esc(t)}</textarea>
        <button type="button" class="btn small ts-remove" data-idx="${idx}">×</button>
      `;
      tsContainer.appendChild(row);
    });
    tsContainer.querySelectorAll('textarea').forEach(ta=>{
      ta.addEventListener('input',()=>{
        const i=Number(ta.dataset.idx);
        tsStepsState[i]=ta.value;
      });
    });
    tsContainer.querySelectorAll('.ts-remove').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const i=Number(btn.dataset.idx);
        tsStepsState.splice(i,1);
        renderSteps();
      });
    });
  })();

  // attachments
  (function renderAttachments(){
    attachList.innerHTML='';
    attachmentsState.forEach((a,idx)=>{
      const pill=document.createElement('div');
      pill.className='attach-pill';
      pill.innerHTML=`
        <span>${esc(a)}</span>
        <button type="button" data-idx="${idx}" data-act="preview">👁</button>
        <button type="button" data-idx="${idx}" data-act="remove">×</button>
      `;
      attachList.appendChild(pill);
    });
    attachList.querySelectorAll('button').forEach(btn=>{
      const idx=Number(btn.dataset.idx);
      const act=btn.dataset.act;
      btn.addEventListener('click',()=>{
        const val=attachmentsState[idx];
        if(act==='remove'){
          attachmentsState.splice(idx,1);
          renderAttachments();
        }else if(act==='preview' && val){
          if(/^https?:\/\//i.test(val)) window.open(val,'_blank');
          else alert('Attachment: '+val);
        }
      });
    });
  })();

  // parts
  (function renderPartList(){
    partList.innerHTML='';
    partsSelected.forEach((p,idx)=>{
      const chip=document.createElement('div');
      chip.className='part-chip';
      chip.innerHTML=`
        <b>${esc(p.item)}</b>
        <span>${esc(p.description)}</span>
        <button type="button" data-idx="${idx}">×</button>
      `;
      partList.appendChild(chip);
    });
    partList.querySelectorAll('button').forEach(btn=>{
      const idx=Number(btn.dataset.idx);
      btn.addEventListener('click',()=>{
        partsSelected.splice(idx,1);
        renderPartList();
      });
    });
  })();
};

/* ===== Dashboard KPIs & charts ===== */
function aggregateBy(cases, field){
  const map = new Map();
  cases.forEach(c=>{
    let key;
    if(field==='pressType') key = c.pressType || 'Unknown';
    else if(field==='region') key = c.region || 'Unknown';
    else key = (c[field] || 'Unknown').trim() || 'Unknown';
    map.set(key,(map.get(key)||0)+1);
  });
  return Array.from(map.entries()).map(([label,count])=>({label,count}));
}
function renderBarList(containerId, items, filter){
  const el=document.getElementById(containerId); if(!el) return;
  el.innerHTML='';
  if(!items.length){
    el.innerHTML=`<div class="bar-row"><span class="bar-label">No data</span></div>`;
    return;
  }
  const max=Math.max(...items.map(i=>i.count));
  items.forEach(it=>{
    const row=document.createElement('div');
    row.className='bar-row';
    row.innerHTML=`
      <span class="bar-label">${esc(it.label)}</span>
      <div class="bar-bar-wrap"><div class="bar-bar" style="width:${(it.count/max)*100}%"></div></div>
      <span class="bar-count">${it.count}</span>
    `;
    row.addEventListener('click',()=>{
      window.pendingCasesFilter = { field, value: it.label };
      go('cases');
    });
    el.appendChild(row);
  });

  function field(){ return filter; }
}
function renderTimeline(cases){
  const el=document.getElementById('dashTimeline'); if(!el) return;
  el.innerHTML='';
  const map=new Map();
  cases.forEach(c=>{
    const d=c.caseDate || '';
    if(!d || d.length<7) return;
    const year=d.slice(0,4);
    const m=parseInt(d.slice(5,7),10);
    if(!m) return;
    const q='Q'+(Math.floor((m-1)/3)+1);
    const key=`${year}-${q}`;
    map.set(key,(map.get(key)||0)+1);
  });
  const arr=Array.from(map.entries()).map(([k,count])=>({key:k,count}));
  arr.sort((a,b)=>a.key.localeCompare(b.key));
  if(!arr.length){
    el.innerHTML=`<div class="timeline-col"><span>No data</span></div>`;
    return;
  }
  const max=Math.max(...arr.map(a=>a.count));
  arr.forEach(it=>{
    const col=document.createElement('div');
    col.className='timeline-col';
    col.innerHTML=`
      <div class="timeline-bar-wrap"><div class="timeline-bar" style="height:${(it.count/max)*80+10}px"></div></div>
      <div>${esc(it.key)}</div>
      <div>${it.count}</div>
    `;
    col.addEventListener('click',()=>{
      window.pendingCasesFilter = { field:'quarter', value: it.key };
      go('cases');
    });
    el.appendChild(col);
  });
}
function updateKPIs(){
  const cases=getCases();
  const total=cases.length;
  const closed=cases.length; // כי אלו קייסים שטופלו ותיעוד
  const hw=cases.filter(c=>c.hwSwEc==='HW' || c.hwSwEc==='Mixed').length;
  const regions = aggregateBy(cases,'region').filter(x=>x.label!=='Unknown').length;

  const elTotal=document.getElementById('kpiTotal');
  const elClosed=document.getElementById('kpiClosed');
  const elHW=document.getElementById('kpiHW');
  const elRegions=document.getElementById('kpiRegions');
  if(elTotal) elTotal.textContent=total;
  if(elClosed) elClosed.textContent=closed;
  if(elHW) elHW.textContent=hw;
  if(elRegions) elRegions.textContent=regions;

  const countEl=document.getElementById('casesCount');
  if(countEl) countEl.textContent=total;

  // Distributions
  renderBarList('dashByPressType', aggregateBy(cases,'pressType'),'pressType');
  renderBarList('dashByRegion',    aggregateBy(cases,'region'),'region');
  renderBarList('dashBySystem',    aggregateBy(cases,'system'),'system');
  renderBarList('dashHwSwEc',      aggregateBy(cases,'hwSwEc'),'hwSwEc');
  renderTimeline(cases);
}
updateKPIs();

/* ===== Settings: export/import/clear ===== */
document.getElementById('btnExportCases')?.addEventListener('click',()=>{
  const data=JSON.stringify(getCases(),null,2);
  const blob=new Blob([data],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='landa_cases_v20.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});
document.getElementById('inputImportCases')?.addEventListener('change',e=>{
  const file=e.target.files?.[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const imported=JSON.parse(reader.result);
      if(!Array.isArray(imported)) throw new Error('bad');
      const current=getCases();
      const merged=[...current];
      imported.forEach(ic=>{
        if(!ic || typeof ic!=='object') return;
        const idx=merged.findIndex(c=>c.id===ic.id);
        if(idx>=0) merged[idx]=ic; else merged.push(ic);
      });
      setCases(merged);
      toast('Cases imported','ok');
    }catch{
      toast('Import failed – invalid file','err');
    }
  };
  reader.readAsText(file);
});
document.getElementById('btnClearCases')?.addEventListener('click',()=>{
  if(!confirm('Clear all cases from this browser?')) return;
  localStorage.removeItem(LS_KEY_CASES);
  setCases([]);
  toast('All cases cleared','ok');
});

/* ===== Expose ===== */
window.getCases = getCases;
window.setCases = setCases;
window.getCaseById = getCaseById;
window.go = go;
window.toast = toast;
window.makeDropdown = makeDropdown;
