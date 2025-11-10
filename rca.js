
/* ========= Root Cause Analyzer – V3 (Guided, Friendly, Robust) =========
   - Auto-init on route 'diagnosis'
   - Guided chips (Issue → Branch → Subsystems)
   - Sticky branch selector
   - Subsystem tabs + search
   - Row UX: checkbox enables inputs; spec pill + mini-range bar
   - Multi-units grid for IPU/Extrusion
   - Works with data/setoff.js (SET_OFF_DATA) and optional BRANCH_MAP
*/
(function(){
  if (window.__RCA_V3__) return;
  window.__RCA_V3__ = true;

  // ---- tiny scoped CSS (non-breaking)
  const css = `
  #rcaWizard .progress{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px}
  #rcaWizard .step{padding:6px 10px;border:1px solid var(--border);border-radius:999px;opacity:.9}
  #rcaWizard .step.active{background:linear-gradient(180deg, rgba(0,174,239,.28), rgba(0,174,239,.08));border-color:rgba(0,174,239,.55)}
  #rcaBranch{position:sticky;top:calc(var(--header) + 10px);z-index:5}
  .pill{padding:4px 10px;border:1px solid var(--border);border-radius:999px;font-size:12.5px}
  .pill.ok{border-color:rgba(74,222,128,.5)} .pill.bad{border-color:rgba(255,73,103,.55)}
  .mini-bar{height:6px;border:1px solid var(--border);border-radius:6px;background:rgba(255,255,255,.05);position:relative;min-width:120px}
  .mini-bar .val{position:absolute;top:-4px;height:14px;width:2px;background:#bfe9ff;border-radius:2px;box-shadow:0 0 8px rgba(0,174,239,.45)}
  .mini-bar .rng{position:absolute;top:1px;bottom:1px;border-radius:6px;background:rgba(74,222,128,.25)}
  .grid.inputs{display:grid;grid-template-columns:repeat(auto-fit, minmax(110px,1fr));gap:8px}
  .hint{color:var(--muted);font-size:12px}
  .sec{margin:8px 0 2px;opacity:.9}
  .inline.wrap{flex-wrap:wrap}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  // ---- helpers
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const esc = s => String(s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

  function h(tag, attrs={}, children=[]) {
    const el = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs||{})) {
      if (k === 'class') el.className = v;
      else if (k === 'style') el.setAttribute('style', v);
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    (Array.isArray(children)? children : [children]).forEach(ch=>{
      if (ch==null) return;
      if (typeof ch === 'string') el.appendChild(document.createTextNode(ch));
      else el.appendChild(ch);
    });
    return el;
  }

  // ---- data normalization
  function normalizeData(){
    const raw = (typeof SET_OFF_DATA!=='undefined') ? SET_OFF_DATA : null;
    if (!raw) return null;
    const subsRaw = raw.subsystems || raw.Subsystems || {};
    const subs = {};
    Object.keys(subsRaw).forEach(k=> subs[String(k).trim()] = subsRaw[k]);
    // branch map
    const keys = Object.keys(subs);
    const exists = n => keys.includes(String(n).trim());
    const branch = window.BRANCH_MAP || {
      drying: ['IRD','STS','Powder','IRD X'].filter(exists),
      coating: ['ICS','BCS'].filter(exists),
      both: keys
    };
    return { issue: raw.issue || 'SetOff', subs, branch };
  }

  function parseSpecToken(tok){
    if (tok==null) return null;
    const s = String(tok).trim();
    const m = s.match(/^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/);
    if (m) return { min: parseFloat(m[1]), max: parseFloat(m[2]) };
    if (/^-?\d+(?:\.\d+)?$/.test(s)) return { target: parseFloat(s) };
    return null; // treat as free text
  }
  function withinSpec(val, spec){
    if (!spec) return null;
    const num = Number(val); if (!isFinite(num)) return null;
    if (typeof spec.min==='number' && num<spec.min) return false;
    if (typeof spec.max==='number' && num>spec.max) return false;
    if (typeof spec.target==='number') return Math.abs(num-spec.target)<=1e-9;
    return true;
  }

  // ---- UI pieces
  function specPill(ok){
    if (ok==null) return h('span', {class:'pill'}, '—');
    return ok? h('span',{class:'pill ok'},'Within spec'):h('span',{class:'pill bad'},'Out of spec');
  }
  function miniBar(spec, value){
    if (!spec || (typeof spec.min!=='number' && typeof spec.max!=='number')) return null;
    const wrap = h('div', {class:'mini-bar'});
    // map  to 0..100 using reasonable domain from spec
    const min = spec.min ?? (spec.target-1);
    const max = spec.max ?? (spec.target+1);
    const rng = h('div',{class:'rng'});
    rng.style.left = '0%'; rng.style.right = '0%';
    if (typeof spec.min==='number' && typeof spec.max==='number'){
      rng.style.left = '0%'; rng.style.width = '100%';
      rng.style.left = '0%';
      // just paint full, the marker shows value
    }
    const marker = h('div',{class:'val'});
    wrap.appendChild(rng); wrap.appendChild(marker);
    function place(v){
      const n = Number(v); if(!isFinite(n)) { marker.style.left='-9999px'; return; }
      const p = Math.max(0, Math.min(100, ((n-min)*100/(max-min)) ));
      marker.style.left = `calc(${p}% - 1px)`;
    }
    place(value);
    wrap._place = place;
    return wrap;
  }

  // Build page
  function build(container){
    container.innerHTML='';
    container.appendChild(h('div',{class:'panel'}, [
      h('h2',{text:'Root Cause Analyzer – Fishbone Troubleshooter', style:'margin:0 0 10px'}),
      h('p',{class:'help', text:'Guided, step-by-step RCA. Choose branch → work through subsystems with actionable checks.'})
    ]));

    // Wizard / progress
    const wiz = h('div',{id:'rcaWizard', class:'panel', style:'margin-top:10px'}, [
      h('div',{class:'progress'}, [
        h('div',{class:'step active', id:'stIssue'}, 'Issue'),
        h('div',{class:'step', id:'stBranch'}, 'Branch'),
        h('div',{class:'step', id:'stSubs'}, 'Subsystems')
      ]),
      h('div',{class:'issue-grid'}, [
        card('SetOff','Drying / Coating', ()=>chooseIssue('setoff')),
        card('Scratches','Print / Blanket', ()=>comingSoon()),
        card('Uniformity','Density / Bands', ()=>comingSoon()),
        card('Jetting','Nozzles / Missing', ()=>comingSoon()),
        card('Transfer','Media / Adhesion', ()=>comingSoon())
      ])
    ]);
    container.appendChild(wiz);

    // Branch (sticky)
    const branchWrap = h('div',{id:'rcaBranch', class:'panel hidden', style:'margin-top:10px'}, [
      h('div',{class:'inline wrap', style:'gap:8px; align-items:center'}, [
        h('div',{class:'title', text:'Select branch:'}),
        chip('Drying', ()=>pickBranch('drying'), true),
        chip('Coating', ()=>pickBranch('coating')),
        chip('Both', ()=>pickBranch('both'))
      ]),
      h('div',{class:'hint', text:'Tip: Choose the path that matches your initial classification. You can switch anytime.'})
    ]);
    container.appendChild(branchWrap);

    // Subsystems host
    const subsHost = h('div',{id:'subsHost', class:'hidden', style:'margin-top:10px'});
    container.appendChild(subsHost);

    function card(title, sub, onClick){
      return h('div',{class:'issue-card', onclick:onClick}, [
        h('div',{class:'title', text:title}), h('div',{class:'sub', text:sub})
      ]);
    }
    function chip(label, onClick, active=false){
      const el = h('div',{class:'chip'+(active?' active':''), onclick:()=>{
        $$('#rcaBranch .chip').forEach(c=>c.classList.remove('active'));
        el.classList.add('active');
        onClick();
      }}, label);
      return el;
    }

    // state
    let currentBranch = null;
    function chooseIssue(issue){
      $('#stIssue').classList.remove('active');
      $('#stBranch').classList.add('active');
      branchWrap.classList.remove('hidden');
      // lock to setoff for now (data exists only there)
      // we could store localStorage if needed
    }
    function comingSoon(){
      alert('Coming soon – this issue will be added next.');
    }

    function pickBranch(kind){
      currentBranch = kind;
      $('#stSubs').classList.add('active');
      renderSubsystems(kind);
    }

    function renderSubsystems(kind){
      const norm = normalizeData();
      if (!norm){ subsHost.classList.remove('hidden'); subsHost.innerHTML = '<div class="panel">Data not loaded (data/setoff.js)</div>'; return; }
      const {subs, branch} = norm;
      const list = (branch[kind]||[]).filter(n=> subs[n]);
      subsHost.classList.remove('hidden');
      subsHost.innerHTML='';

      // tabs + search
      const tabs = h('div',{class:'panel'}, [
        h('div',{class:'inline wrap', style:'gap:8px; align-items:center; justify-content:space-between'}, [
          h('div',{class:'chips', id:'subsTabs'}),
          h('input',{class:'input v13', id:'subsSearch', placeholder:'Search checks…', style:'max-width:220px'})
        ])
      ]);
      subsHost.appendChild(tabs);

      const content = h('div',{id:'subsContent'});
      subsHost.appendChild(content);

      list.forEach((name, idx)=>{
        $('#subsTabs').appendChild(tabChip(`${name}`, idx===0, ()=>showTab(name)));
        content.appendChild(buildSubsystemPanel(name, subs[name]));
      });
      if (list.length) showTab(list[0]);

      // search filter
      $('#subsSearch').addEventListener('input', ()=>{
        const q = $('#subsSearch').value.toLowerCase();
        $$('#subsContent .panel').forEach(p=>{
          const hit = p.dataset.q || '';
          p.style.display = hit.includes(q) ? 'block' : 'none';
        });
      });

      function tabChip(label, active, onClick){
        const chip = h('div', {class:'chip'+(active?' active':''), onclick:()=>{
          $$('#subsTabs .chip').forEach(c=>c.classList.remove('active'));
          chip.classList.add('active'); onClick();
        }}, label);
        return chip;
      }
      function showTab(name){
        $$('#subsContent .panel').forEach(p=> p.style.display='none');
        const el = $(`#subsContent .panel[data-name="${CSS.escape(name)}"]`);
        if (el) el.style.display='block';
      }
    }
  }

  function buildSubsystemPanel(name, node){
    const wrap = h('div',{class:'panel', 'data-name':name});
    wrap.appendChild(h('h3',{text:name}));

    // Collect text for search
    let qbuf = name.toLowerCase()+' ';

    // Node shapes: array of rows OR {checks:[...]} OR sections object
    let rows = null;
    if (Array.isArray(node)) rows = node;
    else if (Array.isArray(node?.checks)) rows = node.checks;

    if (rows){
      const list = buildChecksList(rows, q => qbuf += q);
      wrap.dataset.q = qbuf;
      wrap.appendChild(list);
      return wrap;
    }

    if (node && typeof node==='object'){
      Object.entries(node).forEach(([sec, list])=>{
        wrap.appendChild(h('div',{class:'sec title', text:sec}));
        qbuf += ' '+String(sec||'').toLowerCase();
        wrap.appendChild(buildChecksList(list, q => qbuf += q));
      });
      wrap.dataset.q = qbuf;
      return wrap;
    }

    wrap.appendChild(h('p',{class:'help', text:'No checks defined.'}));
    return wrap;
  }

  function buildChecksList(list, addQ){
    const box = h('div',{class:'grid cols-1', style:'gap:8px;margin-top:6px'});

    // Detect multi-grid cases like IPU 1..7 or Extrusion 1..11
    const labels = (list||[]).map(r => (r&&typeof r==='object' && (r.label||r.check)) ? String(r.label||r.check) : String(r||''));
    const ipu = labels.every(s => /^IPU\s+\d+$/i.test(s));
    const ext = labels.every(s => /^Extrusion\s+\d+$/i.test(s));

    if (ipu || ext){
      const grid = h('div',{class:'grid inputs'});
      labels.forEach((lab, i)=>{
        const specTok = (list[i] && typeof list[i]==='object' && Array.isArray(list[i].spec) ? list[i].spec[0] : null);
        const spec = parseSpecToken(specTok);
        const card = h('div',{class:'panel', style:'padding:10px'});
        card.appendChild(h('div',{class:'title', text:lab}));
        const line = h('div',{class:'inline wrap', style:'gap:6px;align-items:center;margin-top:6px'});
        const cb = h('input',{type:'checkbox'});
        const input = h('input',{class:'input v13', placeholder:'Value', style:'max-width:120px', disabled:true});
        let bar = miniBar(spec, null);
        let pill = specPill(null);
        cb.addEventListener('change', ()=>{ input.disabled = !cb.checked; });
        input.addEventListener('input', ()=>{
          const ok = withinSpec(input.value, spec);
          const np = specPill(ok); pill.replaceWith(np); pill=np;
          if (bar && bar._place) bar._place(input.value);
        });
        line.appendChild(cb); line.appendChild(input);
        if (bar) line.appendChild(bar);
        line.appendChild(pill);
        card.appendChild(line);
        grid.appendChild(card);
        if (addQ) addQ(' '+lab.toLowerCase());
      });
      box.appendChild(grid);
      return box;
    }

    // Regular list (rows as items)
    (list||[]).forEach((row, idx)=>{
      const label = (row&&typeof row==='object') ? (row.label||row.check||`Check ${idx+1}`) : String(row||`Check ${idx+1}`);
      const specTok = (row&&typeof row==='object' && Array.isArray(row.spec)) ? row.spec[0] : null;
      const spec = parseSpecToken(specTok);
      const unit = (row&&row.unit) ? String(row.unit) : '';

      const line = h('div',{class:'inline wrap', style:'align-items:center; gap:8px'});
      const cb = h('input',{type:'checkbox'});
      line.appendChild(cb);
      line.appendChild(h('span',{text:label}));

      const input = h('input',{class:'input v13', placeholder: (unit || 'Value'), style:'max-width:140px', disabled:true});
      let bar = miniBar(spec, null);
      let pill = specPill(null);

      if (spec || (row&&row.free===true)){
        const iw = h('div',{class:'inline wrap', style:'gap:6px; margin-left:8px'});
        iw.appendChild(input);
        if (unit) iw.appendChild(h('span',{class:'help', text:unit}));
        if (bar) iw.appendChild(bar);
        iw.appendChild(pill);
        line.appendChild(iw);
      }

      cb.addEventListener('change', ()=>{ input.disabled = !cb.checked; });
      input.addEventListener('input', ()=>{
        const ok = withinSpec(input.value, spec);
        const np = specPill(ok); pill.replaceWith(np); pill=np;
        if (bar && bar._place) bar._place(input.value);
      });

      if (addQ) addQ(' '+label.toLowerCase());
      box.appendChild(line);
    });

    return box;
  }
})();
 
// ---- Backward-compat for legacy HTML onclick="startDiagnosis('...')"
window.startDiagnosis = function (issue) {
  // ודא שה-wizard נבנה
 if (typeof window.initRootCause === 'function' && !document.getElementById('rcaWizard')) {
    window.initRootCause();
  }
  // סימולציה של בחירת SetOff ב-wizard
  const cards = document.querySelectorAll('#rcaWizard .issue-card');
  const setoffCard = Array.from(cards).find(c =>
    c.querySelector('.title')?.textContent.trim().toLowerCase() === 'setoff'
  ) || cards[0];
  setoffCard?.click();

  // ברירת מחדל: פתח מיד את ה-branch הראשון (למשל Drying)
  setTimeout(() => {
    document.querySelector('#rcaBranch .chip')?.click();
  }, 0);
};
