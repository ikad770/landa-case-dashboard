
/* ========= Root Cause Analyzer (auto-init) =========
   Works with data/setoff.js which defines: const SET_OFF_DATA = { ... }
   - Auto-hooks into global go(route) to initialize when route==='diagnosis'
   - Renders issue selection (currently SetOff only, per user's data)
   - After branching (drying/coating/both), renders subsystems and checklists
   - Each row: checkbox enables its inputs; rows with spec show live status
   - IRD/IRD X multi-units supported if a check has {units: N, unitLabel, spec}
*/

(function(){

  if (window.__RCA_PATCHED__) return;
  window.__RCA_PATCHED__ = true;

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function h(tag, attrs={}, children=[]) {
    const el = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs||{})) {
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach(ch => {
      if (ch==null) return;
      if (typeof ch === 'string') el.appendChild(document.createTextNode(ch));
      else el.appendChild(ch);
    });
    return el;
  }

  function withinSpec(val, spec){
    if (!spec) return null;
    const num = Number(val);
    if (!isFinite(num)) return null;
    if (typeof spec.min === 'number' && num < spec.min) return false;
    if (typeof spec.max === 'number' && num > spec.max) return false;
    return true;
  }

  function specBadge(ok){
    if (ok==null) return h('span', {class:'help'}, '—');
    return ok
      ? h('span', {class:'chip', style:'border-color:rgba(74,222,128,.5)'}, 'Within spec')
      : h('span', {class:'chip', style:'border-color:rgba(255,73,103,.55)'}, 'Out of spec');
  }

  function buildRoot(container){
    container.innerHTML = '';

    container.appendChild(h('div', {class:'panel'}, [
      h('h2', {text:'Root Cause Analyzer – Fishbone Troubleshooter', style:'margin:0 0 10px'}),
      h('p', {class:'help', text:'Follow the guided diagnostic to identify the source of a problem step-by-step.'})
    ]));

    const sel = h('div', {id:'diagSelect', class:'panel', style:'margin-top:10px'}, [
      h('h3', {text:'Select Issue to Diagnose'}),
      h('p', {class:'help', text:'Choose the problem type to start the guided analysis:'}),
      h('div', {class:'issue-grid'}, [
        card('SetOff','Drying / Coating', ()=>startDiagnosis('setoff')),
        card('Scratches','Print / Blanket', ()=>startDiagnosis('scratches')),
        card('Uniformity','Density / Bands', ()=>startDiagnosis('uniformity')),
        card('Jetting','Nozzles / Missing', ()=>startDiagnosis('jetting')),
        card('Transfer','Media / Adhesion', ()=>startDiagnosis('transfer')),
      ])
    ]);
    container.appendChild(sel);

    const step1 = h('div', {id:'diagStep1', class:'panel hidden', style:'margin-top:10px'}, [
      h('h3', {}, ['Problem: ', h('span', {id:'issueName', style:'color:var(--accent)'}, '—')]),
      h('p', {text:'Perform a print of the same job with and without coating, then examine the drying of both samples.'}),
      h('div', {class:'inline', style:'justify-content:flex-end;margin:6px 0 10px'}, [
        h('button', {class:'btn small', onclick:()=>backToIssueSelect()}, '← Change issue')
      ]),
      h('div', {style:'display:flex; flexDirection:column; gap:10px; margin-top:10px'}, [
        h('button', {class:'btn', onclick:()=>selectDiagnosis('drying')}, 'Job without coating is NOT properly dried'),
        h('button', {class:'btn', onclick:()=>selectDiagnosis('coating')}, 'Job with coating is NOT properly dried'),
        h('button', {class:'btn', onclick:()=>selectDiagnosis('both')}, 'Both samples are NOT properly dried'),
      ]),
    ]);
    container.appendChild(step1);

    const step2 = h('div', {id:'diagStep2', class:'hidden', style:'margin-top:14px'});
    container.appendChild(step2);
  }

  function card(title, sub, onClick){
    return h('div', {class:'issue-card', onclick:onClick}, [
      h('div', {class:'title', text:title}),
      h('div', {class:'sub', text:sub}),
    ]);
  }

  function setLS(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function getLS(k){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):null; }catch(e){ return null } }
  const LS_ISSUE='landa_diag_issue';
  const LS_STATE='landa_diag_state';
  const LS_CHECK='landa_diag_checklist';

  function startDiagnosis(issue){
    setLS(LS_ISSUE, issue);
    const sel = document.getElementById('diagSelect'); const s1 = document.getElementById('diagStep1');
    if(sel) sel.classList.add('hidden');
    if(s1) s1.classList.remove('hidden');
    const name = (issue||'').toLowerCase()==='setoff' ? 'SetOff' : (issue||'').charAt(0).toUpperCase()+ (issue||'').slice(1);
    const span = document.getElementById('issueName'); if (span) span.textContent = name;
    const s2 = document.getElementById('diagStep2'); if (s2){ s2.innerHTML=''; s2.classList.add('hidden'); }
    setLS(LS_STATE, null); setLS(LS_CHECK, null);
  }

  function backToIssueSelect(){
    setLS(LS_ISSUE, null); setLS(LS_STATE, null); setLS(LS_CHECK, null);
    const s1=document.getElementById('diagStep1'); const s2=document.getElementById('diagStep2'); const sel=document.getElementById('diagSelect');
    if (s1) s1.classList.add('hidden');
    if (s2){ s2.innerHTML=''; s2.classList.add('hidden'); }
    if (sel){ sel.classList.remove('hidden'); sel.scrollIntoView({behavior:'smooth', block:'start'}); }
  }

  function selectDiagnosis(kind){
    const issue = getLS(LS_ISSUE);
    if ((issue||'').toLowerCase() !== 'setoff'){
      const s2 = document.getElementById('diagStep2');
      if (s2){
        s2.classList.remove('hidden');
        s2.innerHTML = '<div class="panel"><h3>Coming soon</h3><p class="help">Diagnostic data for this issue will be added.</p></div>';
      }
      return;
    }
    setLS(LS_STATE, kind);
    renderChecklist(kind);
  }

  function normalizeData(){
    const data = (typeof SET_OFF_DATA!=='undefined') ? SET_OFF_DATA : null;
    if (!data) return null;
    const subs = data.subsystems || data.Subsystems || {};
    const branch = window.BRANCH_MAP || {
      drying: ['IRD','STS','Powder','IRD X'].filter(k=> subs[k]),
      coating: ['ICS','BCS'].filter(k=> subs[k]),
      both: Object.keys(subs)
    };
    return { subs, branch, title: data.title || 'SetOff' };
  }

  function renderChecklist(kind){
    const host = document.getElementById('diagStep2');
    if (!host) return;
    const norm = normalizeData();
    if (!norm){ host.classList.remove('hidden'); host.innerHTML = '<div class="panel"><h3>Data not loaded</h3><p class="help">Missing or invalid data/setoff.js</p></div>'; return; }

    const {subs, branch, title} = norm;
    const subsList = (branch[kind] || []).filter(name => !!subs[name]);

    host.classList.remove('hidden');
    host.innerHTML = '';

    const tabs = h('div', {class:'chips', id:'rcaTabs'});
    host.appendChild(h('div', {class:'panel'}, [
      h('h3', {text: (kind==='drying'?'Drying System Diagnostic': kind==='coating'?'Coating System Diagnostic':'Full Machine Diagnostic')}),
      h('p', {class:'help', text:'Mark each step as completed. Fields become editable only after checking the box.'}),
      tabs
    ]));

    const content = h('div', {id:'rcaContent'});
    host.appendChild(content);

    subsList.forEach((name, idx)=>{
      tabs.appendChild(tabChip(name, idx===0, ()=>showTab(name)));
      content.appendChild(buildSubsystemPanel(name, subs[name]));
    });

    if (subsList.length) showTab(subsList[0]);

    function tabChip(label, active, onClick){
      const chip = h('div', {class:'chip' + (active?' active':''), onclick: ()=>{
        Array.from(document.querySelectorAll('#rcaTabs .chip')).forEach(c=>c.classList.remove('active'));
        chip.classList.add('active');
        onClick();
      }}, label);
      return chip;
    }

    function showTab(name){
      Array.from(document.querySelectorAll('#rcaContent .panel')).forEach(p=>p.style.display='none');
      const el = document.querySelector(`#rcaContent .panel[data-name="${CSS.escape(name)}"]`);
      if (el) el.style.display='block';
    }
  }

  function buildSubsystemPanel(name, node){
    const wrap = h('div', {class:'panel', 'data-name':name, style:'display:none'});
    wrap.appendChild(h('h3', {text:name}));

    const checks = Array.isArray(node?.checks) ? node.checks : null;
    const sections = checks ? null : node;

    if (checks){
      wrap.appendChild(buildChecksList(checks));
    } else if (sections && typeof sections==='object'){
      Object.entries(sections).forEach(([sec, list])=>{
        wrap.appendChild(h('h4', {text:sec, style:'margin:10px 0 6px; opacity:.9'}));
        wrap.appendChild(buildChecksList(list));
      });
    } else {
      wrap.appendChild(h('p', {class:'help', text:'No checks defined for this subsystem.'}));
    }

    return wrap;
  }

  function buildChecksList(list){
    const box = h('div', {class:'grid cols-1', style:'gap:6px;margin-top:6px'});
    (list||[]).forEach((row, idx)=>{
      const R = normalizeRow(row);
      const line = h('div', {class:'inline', style:'align-items:center; gap:8px'});
      const cb = h('input', {type:'checkbox', id:`rca_cb_${Math.random().toString(36).slice(2)}`});
      line.appendChild(cb);
      line.appendChild(h('span', {text:R.label || `Check ${idx+1}`}));

      if (R.inputs && R.inputs.length){
        const inputsWrap = h('div', {class:'inline', style:'gap:6px; margin-left:8px; flex-wrap:wrap'});
        R.inputs.forEach(inp=>{
          const input = h('input', {class:'input v13', placeholder:inp.placeholder||'', style:'max-width:120px', disabled:true});
          input.addEventListener('input', ()=>{
            const ok = withinSpec(input.value, inp.spec);
            statusEl.replaceWith(createStat(ok));
            statusEl = createStat(ok);
          });
          const unit = inp.spec?.unit ? h('span', {class:'help', text: inp.spec.unit}) : null;
          let statusEl = createStat(null);
          function createStat(ok){ return specBadge(ok); }
          inputsWrap.appendChild(input);
          if (unit) inputsWrap.appendChild(unit);
          inputsWrap.appendChild(statusEl);
        });
        line.appendChild(inputsWrap);
      }

      cb.addEventListener('change', ()=>{
        Array.from(line.querySelectorAll('.input')).forEach(i=> i.disabled = !cb.checked);
      });

      box.appendChild(line);
    });
    return box;
  }

  function normalizeRow(row){
    if (typeof row === 'string') return { label: row, inputs: [] };

    if (row && typeof row === 'object'){
      if (typeof row.units === 'number' && row.units > 1){
        const inputs = Array.from({length: row.units}, (_,i)=> ({
          placeholder: `${row.unitLabel||'Unit'} ${i+1}`,
          spec: row.spec || null
        }));
        return { label: row.label || '', inputs };
      }
      if (row.spec){
        return { label: row.label || '', inputs: [{ placeholder: row.placeholder || '', spec: row.spec }] };
      }
      if (row.free === true){
        return { label: row.label || '', inputs: [{ placeholder: row.placeholder || '' }] };
      }
    }
    return { label: String(row||''), inputs: [] };
  }

  function initRootCause(){
    const page = document.getElementById('page-diagnosis');
    if (!page) return;
    let host = document.getElementById('diagContainer');
    if (!host){
      host = h('div', {id:'diagContainer'});
      page.innerHTML = '';
      page.appendChild(host);
    }
    buildRoot(host);

    const issue = getLS(LS_ISSUE);
    const state = getLS(LS_STATE);
    if (issue){
      startDiagnosis(issue);
      if (state){
        selectDiagnosis(state);
      }
    }
  }

  const originalGo = window.go;
  if (typeof originalGo === 'function'){
    window.go = function(route){
      const res = originalGo.apply(this, arguments);
      if (route === 'diagnosis'){
        setTimeout(initRootCause, 0);
      }
      return res;
    };
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const diagVisible = document.getElementById('page-diagnosis') && !document.getElementById('page-diagnosis').classList.contains('hidden');
    if (diagVisible) initRootCause();
  });

  window.initRootCause = initRootCause;
  window.startDiagnosis = startDiagnosis;
  window.selectDiagnosis = selectDiagnosis;
  window.backToIssueSelect = backToIssueSelect;

})();
