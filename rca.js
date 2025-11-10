/* ================================================================
   Landa Quantum – Root Cause Analyzer (V18.9-Stable)
   Wizard UI + Smart Diagnosis Engine
   ------------------------------------------------
   Loads after: app.js, ./data/setoff.js
   Expects: const SET_OFF_DATA = { subsystems: {...} }
================================================================ */

(function(){
  if (window.__LANDA_RCA__) return;
  window.__LANDA_RCA__ = true;

  /* ---------- scoped CSS ---------- */
  const css = `
  #rcaRoot .progress{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px}
  #rcaRoot .step{padding:6px 10px;border:1px solid var(--border);border-radius:999px;opacity:.9}
  #rcaRoot .step.active{background:linear-gradient(180deg, rgba(0,174,239,.28), rgba(0,174,239,.08));border-color:rgba(0,174,239,.55)}
  #rcaBranch{position:sticky;top:calc(var(--header) + 10px);z-index:5}
  .pill{padding:4px 10px;border:1px solid var(--border);border-radius:999px;font-size:12.5px}
  .pill.ok{border-color:rgba(74,222,128,.55)} .pill.bad{border-color:rgba(255,73,103,.6)}
  .mini-bar{height:6px;border:1px solid var(--border);border-radius:6px;background:rgba(255,255,255,.05);position:relative;min-width:120px}
  .mini-bar .val{position:absolute;top:-4px;height:14px;width:2px;background:#bfe9ff;border-radius:2px;box-shadow:0 0 8px rgba(0,174,239,.45)}
  .mini-bar .rng{position:absolute;top:1px;bottom:1px;border-radius:6px;background:rgba(74,222,128,.25);left:10%;right:10%}
  .grid.inputs{display:grid;grid-template-columns:repeat(auto-fit, minmax(140px,1fr));gap:8px}
  .hint{color:var(--muted);font-size:12px}
  .sec{margin:8px 0 2px;opacity:.9}
  .inline.wrap{flex-wrap:wrap}
  .rca-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:12px}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  /* ---------- helpers ---------- */
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function h(tag, attrs={}, children=[]){
    const el = document.createElement(tag);
    for (const [k,v] of Object.entries(attrs||{})) {
      if (k==='class') el.className = v;
      else if (k==='style') el.setAttribute('style', v);
      else if (k==='text') el.textContent = v;
      else if (k.startsWith('on') && typeof v==='function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    (Array.isArray(children)?children:[children]).forEach(ch=>{
      if(ch==null) return;
      if(typeof ch==='string') el.appendChild(document.createTextNode(ch));
      else el.appendChild(ch);
    });
    return el;
  }

  /* ---------- data ---------- */
  function normalizeData(){
    const raw = (typeof SET_OFF_DATA!=='undefined') ? SET_OFF_DATA : null;
    if (!raw) return null;
    const subsRaw = raw.subsystems || raw.Subsystems || {};
    const subs = {};
    Object.keys(subsRaw).forEach(k=> subs[String(k).trim()] = subsRaw[k]);
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
    return null;
  }
  function withinSpec(val, spec){
    if (!spec) return null;
    const num = Number(val); if (!isFinite(num)) return null;
    if (typeof spec.min==='number' && num<spec.min) return false;
    if (typeof spec.max==='number' && num>spec.max) return false;
    if (typeof spec.target==='number') return Math.abs(num-spec.target)<=1e-9;
    return true;
  }
  function specPill(ok){
    if (ok==null) return h('span', {class:'pill'}, '—');
    return ok ? h('span',{class:'pill ok'},'Within spec') : h('span',{class:'pill bad'},'Out of spec');
  }
  function miniBar(spec, value){
    if (!spec || (typeof spec.min!=='number' && typeof spec.max!=='number')) return null;
    const min = (typeof spec.min==='number') ? spec.min : (spec.target-1||0);
    const max = (typeof spec.max==='number') ? spec.max : (spec.target+1||1);
    const wrap = h('div',{class:'mini-bar'});
    const rng = h('div',{class:'rng'});
    const marker = h('div',{class:'val'});
    wrap.appendChild(rng); wrap.appendChild(marker);
    function place(v){
      const n = Number(v); if(!isFinite(n)){ marker.style.left='-9999px'; return; }
      const p = Math.max(0, Math.min(100, ((n-min)*100/(max-min)) ));
      marker.style.left = `calc(${p}% - 1px)`;
    }
    place(value);
    wrap._place = place;
    return wrap;
  }

  /* ---------- builder ---------- */
  function build(host){
    host.innerHTML='';
    const root = h('div',{id:'rcaRoot'});

    // Header
    root.appendChild(h('div',{class:'panel'}, [
      h('h2',{text:'Root Cause Analyzer – Fishbone Troubleshooter', style:'margin:0 0 10px'}),
      h('p',{class:'help', text:'Guided RCA with smart diagnosis & suggested fixes.'})
    ]));

    // Wizard – Issue step
    const wiz = h('div',{class:'panel', style:'margin-top:10px'}, [
      h('div',{class:'progress'},[
        h('div',{class:'step active', id:'stIssue'}, 'Issue'),
        h('div',{class:'step', id:'stBranch'}, 'Branch'),
        h('div',{class:'step', id:'stSubs'}, 'Subsystems'),
        h('div',{class:'step', id:'stDiag'}, 'Diagnosis')
      ]),
      h('div',{class:'issue-grid'}, [
        card('SetOff','Drying / Coating', ()=>chooseIssue('setoff')),
        card('Scratches','Print / Blanket', ()=>soon()),
        card('Uniformity','Density / Bands', ()=>soon()),
        card('Jetting','Nozzles / Missing', ()=>soon()),
        card('Transfer','Media / Adhesion', ()=>soon())
      ])
    ]);
    root.appendChild(wiz);

    // Branch selector
    const branchWrap = h('div',{id:'rcaBranch', class:'panel hidden', style:'margin-top:10px'}, [
      h('div',{class:'inline wrap', style:'gap:8px; align-items:center'}, [
        h('div',{class:'title', text:'Select branch:'}),
        chip('Drying', ()=>pickBranch('drying'), true),
        chip('Coating', ()=>pickBranch('coating')),
        chip('Both', ()=>pickBranch('both'))
      ]),
      h('div',{class:'hint', text:'You can switch branch at any time.'})
    ]);
    root.appendChild(branchWrap);

    // Subsystems host
    const subsHost = h('div',{id:'subsHost', class:'hidden', style:'margin-top:10px'});
    root.appendChild(subsHost);

    // Actions
    const actions = h('div',{class:'rca-actions hidden', id:'rcaActions'}, [
      h('button',{class:'btn', onclick:runDiagnosis}, 'Run Diagnosis'),
      h('button',{class:'btn ghost', onclick:resetWizard}, 'Restart')
    ]);
    root.appendChild(actions);

    host.appendChild(root);

    /* ---- helpers inside build ---- */
    function card(title, sub, onClick){
      return h('div',{class:'issue-card', onclick:onClick}, [
        h('div',{class:'title', text:title}), h('div',{class:'sub', text:sub})
      ]);
    }
    function chip(label, onClick, active=false){
      const el = h('div',{class:'chip'+(active?' active':''), onclick:()=>{
        $$('#rcaBranch .chip').forEach(c=>c.classList.remove('active'));
        el.classList.add('active'); onClick();
      }}, label);
      return el;
    }
    function soon(){ alert('Coming soon.'); }

    // State
    let currentBranch = null;

    function chooseIssue(issue){
      $('#stIssue').classList.remove('active');
      $('#stBranch').classList.add('active');
      branchWrap.classList.remove('hidden');
    }

    function pickBranch(kind){
      currentBranch = kind;
      $('#stSubs').classList.add('active');
      renderSubsystems(kind);
    }

    function resetWizard(){
      subsHost.innerHTML='';
      subsHost.classList.add('hidden');
      branchWrap.classList.add('hidden');
      $('#rcaActions').classList.add('hidden');
      $$('#rcaRoot .step').forEach(s=>s.classList.remove('active'));
      $('#stIssue').classList.add('active');
    }

    function renderSubsystems(kind){
      const norm = normalizeData();
      subsHost.classList.remove('hidden');
      subsHost.innerHTML='';
      if (!norm){
        subsHost.innerHTML = '<div class="panel">Data not loaded (data/setoff.js)</div>';
        return;
      }
      const {subs, branch} = norm;
      const list = (branch[kind]||[]).filter(n=> subs[n]);

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
        $('#subsTabs').appendChild(tabChip(fixLabel(name), idx===0, ()=>showTab(name)));
        content.appendChild(buildSubsystemPanel(name, subs[name]));
      });
      if (list.length) showTab(list[0]);

      // search
      $('#subsSearch').addEventListener('input', ()=>{
        const q = $('#subsSearch').value.toLowerCase();
        $$('#subsContent .panel').forEach(p=>{
          const hit = p.dataset.q || '';
          p.style.display = hit.includes(q) ? 'block' : 'none';
        });
      });

      $('#rcaActions').classList.remove('hidden');

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
      function fixLabel(n){ return String(n||'').replace(/\s+/g,' ').trim(); }
    }

    function buildSubsystemPanel(name, node){
      const wrap = h('div',{class:'panel', 'data-name':name});
      wrap.appendChild(h('h3',{text:name}));
      let qbuf = name.toLowerCase()+' ';

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

      (list||[]).forEach((row, idx)=>{
        const label = (row&&typeof row==='object') ? (row.label||row.check||`Check ${idx+1}`) : String(row||`Check ${idx+1}`);
        const specTok = (row&&typeof row==='object' && Array.isArray(row.spec)) ? row.spec[0] : null;
        const spec = parseSpecToken(specTok);
        const unit = (row&&row.unit) ? String(row.unit) : '';

        const line = h('div',{class:'inline wrap', style:'align-items:center; gap:8px'});
        const cb = h('input',{type:'checkbox'});
        line.appendChild(cb);
        line.appendChild(h('span',{text:label}));

        const input = h('input',{class:'input v13', placeholder:(unit || 'Value'), style:'max-width:140px', disabled:true});
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

    /* ---- Diagnosis ---- */
    function runDiagnosis(){
      const result = collectResults();
      const report = analyze(result);
      showDiagnosis(report);
      $('#stDiag').classList.add('active');
    }
    function collectResults(){
      const panels = $$('#subsContent .panel');
      const data = { subs: {}, branch: null };
      const branchChip = $('#rcaBranch .chip.active');
      data.branch = branchChip ? branchChip.textContent.trim().toLowerCase() : null;
      panels.forEach(p=>{
        const name = p.getAttribute('data-name');
        const items = [];
        const lines = $$('div.inline.wrap', p);
        lines.forEach(r=>{
          const cb = $('input[type="checkbox"]', r.parentElement) || $('input[type="checkbox"]', r);
          const enabled = cb ? cb.checked : false;
          const labelEl = r.parentElement.querySelector('span');
          const label = labelEl ? labelEl.textContent.trim() : '';
          const inp = $('input.input.v13', r);
          const value = inp ? inp.value.trim() : '';
          const pill = $('.pill', r);
          const status = pill ? (pill.classList.contains('bad') ? 'out' : (pill.classList.contains('ok') ? 'ok' : 'n/a')) : 'n/a';
          items.push({ label, enabled, value, status });
        });
        data.subs[name] = items;
      });
      return data;
    }
    function analyze(data){
      const out = { branch: data.branch, subs: {}, totals:{enabled:0, filled:0, out:0}, summary:[], recommendations:[] };
      Object.entries(data.subs).forEach(([name, items])=>{
        const rec = { enabled:0, filled:0, out:0 };
        items.forEach(x=>{
          if (x.enabled) rec.enabled++;
          if (x.enabled && x.value) rec.filled++;
          if (x.enabled && x.value && x.status==='out') rec.out++;
        });
        out.subs[name]=rec;
        out.totals.enabled+=rec.enabled;
        out.totals.filled+=rec.filled;
        out.totals.out+=rec.out;
        if (rec.enabled>0) out.summary.push(`${name}: ${rec.out}/${rec.filled} out-of-spec`);
      });
      const worst = Object.entries(out.subs).sort((a,b)=> (b[1].out)-(a[1].out))[0];
      if (worst){
        const key = worst[0].toLowerCase();
        if (key.includes('ird')) out.recommendations.push('Verify IRD current calibration and IPU balance; inspect exhaust flow.');
        if (key.includes('sts')) out.recommendations.push('Check STS fans and temperature sensors; recalibrate if needed.');
        if (key.includes('powder')) out.recommendations.push('Verify powder application rate and pump pressure; clean nozzles.');
        if (key.includes('ics') || key.includes('bcs')) out.recommendations.push('Check coating viscosity/profile and UV/IR lamp operation.');
      }
      if (out.totals.out===0 && out.totals.filled>0){
        out.recommendations.push('All values within spec. Verify media/settings; consider raising throughput.');
      }
      return out;
    }
    function showDiagnosis(report){
      let modalBack = document.getElementById('modalBack');
      let modal = document.getElementById('modal');
      if (!modalBack || !modal){
        modalBack = h('div',{class:'modal-back', id:'modalBack'});
        modal = h('div',{class:'modal', id:'modal'});
        modalBack.appendChild(modal);
        document.body.appendChild(modalBack);
      }
      modal.innerHTML='';
      modal.appendChild(h('div',{class:'title', text:'Smart Diagnosis'}));
      const body = h('div',{style:'margin-top:12px'});
      modal.appendChild(body);

      body.appendChild(h('div',{class:'panel'}, [
        h('div',{class:'kv'},[h('span',{class:'k',text:'Branch:'}), h('span',{class:'v',text: String((report.branch||'').toUpperCase())})]),
        h('div',{class:'kv'},[h('span',{class:'k',text:'Summary:'}), h('span',{class:'v',text: report.summary.join(' | ') || 'No checks enabled'})]),
        h('div',{class:'kv'},[h('span',{class:'k',text:'Totals:'}), h('span',{class:'v',text:`Enabled ${report.totals.enabled}, Filled ${report.totals.filled}, Out-of-spec ${report.totals.out}`})])
      ]));

      body.appendChild(h('div',{class:'panel', style:'margin-top:10px'}, [
        h('h3',{text:'Recommendations'}),
        report.recommendations.length
          ? h('ul',{}, report.recommendations.map(r=> h('li',{text:r})))
          : h('div',{class:'help', text:'No specific recommendations.'})
      ]));

      const footer = h('div',{class:'rca-actions'}, [
        h('button',{class:'btn primary', onclick:()=>saveAsCase(report)}, 'Save as Case'),
        h('button',{class:'btn small danger', onclick:()=>{ modalBack.style.display='none'; }}, 'Close')
      ]);
      body.appendChild(footer);

      modalBack.style.display='flex';
    }
    function saveAsCase(report){
      try{
        if (typeof go==='function'){ go('create'); }
        setTimeout(()=>{
          const issue = document.getElementById('issueSummary');
          const solution = document.getElementById('solution');
          const symptoms = document.getElementById('symptoms');
          if (issue) issue.value = `RCA: ${String(report.branch||'').toUpperCase()} | ${report.summary.join(' | ')}`;
          if (symptoms) symptoms.value = (report.recommendations||[]).map(r=>`• ${r}`).join('\n');
          if (solution) solution.value = 'Execute top recommendations. Re-measure and re-run RCA.';
          if (typeof toast==='function') toast('Diagnosis copied to new case','ok');
        }, 80);
      }catch(e){
        const blob = new Blob([JSON.stringify(report,null,2)], {type:'application/json'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download='diagnosis.json'; a.click();
      }
      const mb = document.getElementById('modalBack'); if (mb) mb.style.display='none';
    }
  } // end build()

  /* ---------- expose init ---------- */
  window.initRootCause = function(){
    const page = document.getElementById('page-diagnosis');
    if (!page) return;
    let host = document.getElementById('diagContainer');
    if (!host){
      host = document.createElement('div'); host.id = 'diagContainer';
      page.innerHTML = ''; page.appendChild(host);
    }
    build(host);
  };

  // Hook router
  const __origGo = window.go;
  if (typeof __origGo === 'function'){
    window.go = function(route){
      const res = __origGo.apply(this, arguments);
      if (route === 'diagnosis') setTimeout(window.initRootCause, 0);
      return res;
    };
  }

  // Auto-init on visible
  document.addEventListener('DOMContentLoaded', ()=>{
    const pg = document.getElementById('page-diagnosis');
    if (pg && !pg.classList.contains('hidden')) window.initRootCause();
  });

})(); // IIFE end

/* ---------- Legacy onclick compat ---------- */
window.startDiagnosis = function(issue){
  if (typeof window.initRootCause === 'function' && !document.getElementById('rcaRoot')) {
    window.initRootCause();
  }
  const cards = document.querySelectorAll('#rcaRoot .issue-card');
  const setoffCard = Array.from(cards).find(c =>
    c.querySelector('.title')?.textContent.trim().toLowerCase() === 'setoff'
  ) || cards[0];
  setoffCard?.click();
  setTimeout(()=>{
    document.querySelector('#rcaBranch .chip')?.click();
  },0);
};
