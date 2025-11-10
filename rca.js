
/* ========= Root Cause Analyzer (auto-init, robust data parser) ========= */
(function(){

  if (window.__RCA_PATCHED_V2__) return;
  window.__RCA_PATCHED_V2__ = true;

  const $ = (sel, root=document) => root.querySelector(sel);

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

  function parseSpecToken(tok){
    if (!tok || typeof tok!=='string') return null;
    const s = tok.trim();
    // range: "7-9" or "7.0-9.0"
    const m = s.match(/^(-?\d+(\.\d+)?)\s*-\s*(-?\d+(\.\d+)?)/);
    if (m) return { min: parseFloat(m[1]), max: parseFloat(m[3]) };
    // single numeric: "-25" or "2300"
    const n = s.match(/^-?\d+(\.\d+)?$/);
    if (n) return { target: parseFloat(s) };
    return { note: s };
  }

  function withinSpec(val, spec){
    if (!spec) return null;
    const num = Number(val);
    if (!isFinite(num)) return null;
    if (typeof spec.min === 'number' && num < spec.min) return false;
    if (typeof spec.max === 'number' && num > spec.max) return false;
    if (typeof spec.target === 'number') return Math.abs(num - spec.target) < 1e-9;
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

  function startDiagnosis(issue){
    setLS(LS_ISSUE, issue);
    const sel = document.getElementById('diagSelect'); const s1 = document.getElementById('diagStep1');
    if(sel) sel.classList.add('hidden');
    if(s1) s1.classList.remove('hidden');
    const name = (issue||'').toLowerCase()==='setoff' ? 'SetOff' : (issue||'').charAt(0).toUpperCase()+ (issue||'').slice(1);
    const span = document.getElementById('issueName'); if (span) span.textContent = name;
    const s2 = document.getElementById('diagStep2'); if (s2){ s2.innerHTML=''; s2.classList.add('hidden'); }
    setLS(LS_STATE, null);
  }

  function backToIssueSelect(){
    setLS(LS_ISSUE, null); setLS(LS_STATE, null);
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
    const raw = (typeof SET_OFF_DATA!=='undefined') ? SET_OFF_DATA : null;
    if (!raw) return null;

    const subsRaw = raw.subsystems || raw.Subsystems || {};
    // normalize keys: trim and map
    const subs = {};
    Object.keys(subsRaw).forEach(k=>{
      const key = String(k).trim();
      subs[key] = subsRaw[k];
    });

    // Build branch map from available keys
    const keys = Object.keys(subs);
    function exists(name){ return keys.includes(name) || keys.includes(String(name).trim()); }
    const branch = window.BRANCH_MAP || {
      drying: ['IRD','STS','Powder','IRD X'].filter(exists),
      coating: ['ICS','BCS'].filter(exists),
      both: keys
    };
    return { subs, branch, title: raw.issue || 'SetOff' };
  }

  function renderChecklist(kind){
    const host = document.getElementById('diagStep2');
    if (!host) return;
    const norm = normalizeData();
    if (!norm){ host.classList.remove('hidden'); host.innerHTML = '<div class="panel"><h3>Data not loaded</h3><p class="help">Missing or invalid data/setoff.js</p></div>'; return; }

    const {subs, branch} = norm;
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

    // 3 possible shapes:
    // A) { checks: [...] }
    // B) array of rows: [{check, spec:[...]}, ...]
    // C) sections object: { SectionName: [rows...] }
    if (Array.isArray(node?.checks)){
      wrap.appendChild(buildChecksList(node.checks));
    } else if (Array.isArray(node)){
      wrap.appendChild(buildChecksList(node));
    } else if (node && typeof node==='object'){
      Object.entries(node).forEach(([sec, list])=>{
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
      const cb = h('input', {type:'checkbox'});
      line.appendChild(cb);
      line.appendChild(h('span', {text:R.label || `Check ${idx+1}`}));

      if (R.inputs && R.inputs.length){
        const inputsWrap = h('div', {class:'inline', style:'gap:6px; margin-left:8px; flex-wrap:wrap'});
        R.inputs.forEach(inp=>{
          const input = h('input', {class:'input v13', placeholder:inp.placeholder||'', style:'max-width:120px', disabled:true});
          let statusEl = specBadge(null);
          input.addEventListener('input', ()=>{
            const ok = withinSpec(input.value, inp.spec);
            const newEl = specBadge(ok);
            statusEl.replaceWith(newEl);
            statusEl = newEl;
          });
          inputsWrap.appendChild(input);
          if (inp.unit) inputsWrap.appendChild(h('span', {class:'help', text: inp.unit}));
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
    // Excel-derived shape: {check: 'IPU 1', spec: ['-25']}
    if (row && typeof row==='object' && ('check' in row || 'label' in row)){
      const label = row.label || row.check || '';
      const specArr = Array.isArray(row.spec) ? row.spec : null;
      let spec = null
      if (specArr && specArr.length){
        // take first spec token only (Excel format)
        spec = parseSpecToken(String(specArr[0]));
      }
      // Multi-units by naming convention (e.g., IPU 1..7 or Extrusion 1..11) -> single field per check
      return { label, inputs: [{ placeholder:'Value', spec: spec, unit: (row.unit||'') }] };
    }

    if (typeof row === 'string') return { label: row, inputs: [] };

    // fallback
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
  }

  // Patch go(route) to hook diagnosis page entrance
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
