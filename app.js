// app.js - קוד מלא ומעודכן
/* ===== Helpers ===== */
function toast(msg,type='ok'){ const t=document.createElement('div'); t.className='toast '+type; t.textContent=msg; const w=document.getElementById('toasts'); w.appendChild(t); setTimeout(()=>{t.style.opacity='0'; setTimeout(()=>t.remove(),250)},1600); }
function esc(s){ return (s||'').replace(/[&<>\"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c])) } 
function nl(s){ return String(s||'').replace(/\n/g,'<br>') }

// מפתח ל-localStorage - שונה ל-V14 כדי לאתחל את הדאטה המחייב החדש
const LS_KEY='landa_cases_v14'; 
const ENUMS = window.LANDA_ENUMS || {};

/* ===== Storage ===== */
function getCases(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); }catch(e){ return [] } }
function setCases(arr){ localStorage.setItem(LS_KEY, JSON.stringify(arr)); updateKPIs(); }
function logout(){ localStorage.removeItem('landa_logged'); window.location.reload(); }
function clearData(){ if(confirm('Are you sure you want to delete ALL local case data? This cannot be undone!')){ localStorage.removeItem(LS_KEY); toast('All data cleared.','warn'); go('dashboard'); } }


/* ===== Routing ===== */
const pages=['dashboard','create','cases','diagnosis','settings'];
const fabNew=document.getElementById('fabNew');

function go(route){
  pages.forEach(p=>document.getElementById('page-'+p).classList.add('hidden'));
  const tgt=document.getElementById('page-'+route); if(tgt) tgt.classList.remove('hidden');
  document.querySelectorAll('.nav .item').forEach(a=>a.classList.toggle('active', a.dataset.route===route));
  
  if(route==='dashboard') updateKPIs();
  // קורא לפונקציית הרינדור מתוך js/cases.js, מוודא שהיא גלובלית
  if(route==='cases') window.renderCases(); 
  if(route==='create') initCreatePage(); 
  // קורא ל-Launcher של ה-Wizard מתוך js/rca.js
  if(route==='diagnosis') window.injectRcaLauncher(); 
  
  if(fabNew) fabNew.style.display=route==='dashboard'?'flex':'none';
}

function init(){
  const isLogged=localStorage.getItem('landa_logged')==='true';
  document.getElementById('loginPage').style.display=isLogged?'none':'flex';
  document.getElementById('app').style.display=isLogged?'flex':'none';
  if(isLogged) go('dashboard');
}

/* ===== Case Management & Form Logic ===== */

function saveCase(e){
  e.preventDefault();
  
  const form=e.target;
  const newCase = {
    sfCase: form.sfCase.value || 'N/A',
    model: form.model.value || 'N/A',
    
    // שדות הסכמה המחייבת החדשים
    system: form.system.value, 
    subSystem: form.subSystem.value, 
    issueCode: form.issueCode.value,
    solutionDifficulty: form.solutionDifficulty.value,
    
    issueSummary: form.issueSummary.value,
    rootCause: form.rootCause.value,
    solution: form.solution.value,
    verification: form.verification.value || '',
    notes: form.notes.value || '',
    
    // ... (שדות קיימים)
    createdAt: new Date().toISOString(),
    attachments: Array.from(document.querySelectorAll('#filesWrap input[type="text"]')).map(i=>i.value).filter(Boolean),
    
    // שדה לדירוג הצלחה עתידי
    successRating: { count: 0, tries: 0, rate: 0, resolutionTime: null }
  };

  const arr=getCases(); arr.unshift(newCase); setCases(arr);
  toast('Case saved successfully!','ok'); form.reset(); go('cases');
}

// פונקציה לבניית Select Box מנתוני ה-ENUMS
function populateSelect(id, data, emptyText){
  const select = document.getElementById(id);
  if(!select) return;
  select.innerHTML = '';
  select.innerHTML += `<option value="" disabled selected>${emptyText}</option>`;
  data.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  });
}

function initCreatePage(){
  const form = document.getElementById('createCaseForm');
  if(form) form.onsubmit = saveCase;
  
  // מילוי תיבות הבחירה מנתוני ה-ENUMS
  populateSelect('system', ENUMS.SYSTEMS, 'Select Landa System');
  populateSelect('issueCode', ENUMS.ISSUE_CODES, 'Select Issue Type');
  populateSelect('solutionDifficulty', ENUMS.DIFFICULTY_LEVELS, 'Select Difficulty Level');
  
  const systemSelect = document.getElementById('system');
  const subSystemSelect = document.getElementById('subSystem');
  
  // לוגיקת תתי-המערכות התלויים במערכת הראשית
  systemSelect.onchange = function(){
    const selectedSystemId = systemSelect.value;
    const system = ENUMS.SYSTEMS.find(s => s.id === selectedSystemId);
    
    if(system && system.subs && system.subs.length > 0){
      subSystemSelect.disabled = false;
      subSystemSelect.innerHTML = '';
      subSystemSelect.innerHTML += `<option value="" disabled selected>Select Subsystem</option>`;
      system.subs.forEach(subName => {
        const option = document.createElement('option');
        option.value = subName;
        option.textContent = subName;
        subSystemSelect.appendChild(option);
      });
    } else {
      subSystemSelect.disabled = true;
      subSystemSelect.innerHTML = `<option value="">No Subsystems defined</option>`;
    }
  };
}


function addFileRow(){
  const wrap=document.getElementById('filesWrap'); if(!wrap) return;
  const div=document.createElement('div'); div.className='inline full'; div.style.gap='8px';
  div.innerHTML = `
    <input type="text" class="input v13" placeholder="File URL or description" style="flex-grow:1">
    <button class="btn small danger" type="button" onclick="this.parentNode.remove()">X</button>
  `;
  wrap.appendChild(div);
}

function startSearch(){
    const q = document.getElementById('mainSearch').value;
    if (q.trim()) {
        toast(`Searching for: ${q}`, 'warn');
        go('cases');
        // יופעל ה-renderCases ב-js/cases.js עם הפילטר
        setTimeout(() => {
            const searchInput = document.getElementById('q');
            if(searchInput) {
                searchInput.value = q;
                const applyBtn = document.getElementById('apply');
                if(applyBtn) applyBtn.click();
            }
        }, 100);
    } else {
        toast('Please enter a search term.', 'warn');
    }
}


/* ===== KPI Logic (כולל חישוב זמן ממוצע) ===== */
function updateKPIs(){
  const arr=getCases(); 
  document.getElementById('kpiTotal').textContent=arr.length;
  document.getElementById('kpiFiles').textContent=arr.filter(c=>Array.isArray(c.attachments)&&c.attachments.length).length;
  
  // נתון הצלחה מדומיין
  const successRate = arr.length ? (Math.floor(Math.random() * 20) + 80) + '%' : '—';
  document.getElementById('kpiSuccessRate').textContent = successRate;
  
  const last=arr.length? new Date(arr[0].createdAt).toLocaleString() : '—'; // Case חדש בראש הרשימה
  document.getElementById('kpiUpdated').textContent=last;
  
  // זמן ממוצע לפתרון מדומיין
  const avgTime = arr.length ? (Math.floor(Math.random() * 5) + 1) + 'd' : '—';
  document.getElementById('kpiAvgTime').textContent = avgTime;

  const pageCasesCount=document.getElementById('casesCount'); 
  if(pageCasesCount) pageCasesCount.textContent=String(arr.length);
}


/* ===== Particles ===== */
(function(){
  const c=document.getElementById('particles'); if(!c) return; const ctx=c.getContext('2d'); let w,h;
  function resize(){ w=c.width=innerWidth; h=c.height=innerHeight; }
  addEventListener('resize',resize); resize();
  const dots=Array.from({length:60},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.6+0.6,vx:(Math.random()-.5)*0.28,vy:(Math.random()-.5)*0.28}));
  function step(){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='rgba(0,174,239,.3)';
    for(const d of dots){
      d.x+=d.vx; d.y+=d.vy;
      if(d.x<0||d.x>w) d.vx*=-1;
      if(d.y<0||d.y>h) d.vy*=-1;
      ctx.beginPath();
      ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(step);
  }
  step();
})();


// Event listeners
addEventListener('load',init);
document.getElementById('fabNew').onclick=()=>go('create');
document.getElementById('loginForm').onsubmit=(e)=>{e.preventDefault(); localStorage.setItem('landa_logged','true'); init(); toast('Welcome, Landa Engineer!','ok'); };
