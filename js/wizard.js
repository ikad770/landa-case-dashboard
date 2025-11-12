/* RCA Wizard V19.1 – A + D flow with hidden B scoring
   - Issue select → Triage → Mechanism hint → Subsystems (cards) → Specs → Diagnosis
   - Non-breaking: hooks into go('diagnosis'), preserves look & feel
*/

(function(){
  if (window.__RCA_WIZ_PRO__) return; window.__RCA_WIZ_PRO__ = true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

  const STATE = {
    issue:null,        // 'setoff' | 'scratches' | 'uniformity' | 'pq'
    triage:{},         // id -> value
    mechanismHints:{}, // weights merged from answers
    measures:{},       // subsystem.id -> { check.id -> value }
    doneChecks:{},     // check enabled/checked flags
    scores:{},         // mechanism -> score 0..1
    branches:[]        // list of subsystem ids selected for this flow
  };

  // ---------- scoring helpers (B hidden) ----------
  function addHint(weights, w){
    for(const k in w){ weights[k] = (weights[k]||0) + Number(w[k]||0); }
    return weights;
  }
  function normScores(weights){
    // normalize to 0..1
    const vals = Object.values(weights); if(!vals.length) return {};
    const max = Math.max(...vals); if(max<=0) return {};
    const out={}; for(const k in weights){ out[k]= +(weights[k]/max).toFixed(3); }
    return out;
  }
  function scoreFromSpec(value, spec){
    if(!spec || spec.length<2 || value==='' || value==null) return 0; // no effect
    const v = Number(value); if(Number.isNaN(v)) return 0;
    const [min,max] = spec; const center=(min+max)/2;
    if(v>=min && v<=max) return 0.1; // small positive – within spec supports mechanism but not root cause
    const dist = Math.min(Math.abs(v-min), Math.abs(v-max));
    const span = (max-min)||1;
    return Math.min(1, Math.max(0.2, dist/span)); // outside spec boosts suspicion
  }

  // ---------- UI builders ----------
  function mountRoot(){
    const page = document.getElementById('page-diagnosis'); if(!page) return;

    page.innerHTML = `
      <div class="panel">
        <h2 style="margin:0 0 6px">Root Cause Analyzer — Pro Wizard</h2>
        <p class="help">Select the issue to start a guided fishbone troubleshoot.</p>
        <div class="issue-grid" id="rcaIssues">
          <div class="issue-card" data-i="setoff"><div class="title">SetOff</div><div class="sub">Drying / Coating</div></div>
          <div class="issue-card" data-i="scratches"><div class="title">Scratches</div><div class="sub">Surface / Transport</div></div>
          <div class="issue-card" data-i="uniformity"><div class="title">Uniformity</div><div class="sub">Bands / Streaks</div></div>
          <div class="issue-card" data-i="pq"><div class="title">PQ</div><div class="sub">Print Quality</div></div>
        </div>
      </div>
      <div id="rcaFlow"></div>
    `;

    $$('#rcaIssues .issue-card', page).forEach(c=>{
      c.onclick = ()=> startIssue(c.dataset.i);
    });
  }

  function startIssue(code){
    const data = window.RCA_DATA?.[code]; if(!data){ toast('Unknown issue: '+code,'err'); return; }
    Object.assign(STATE, { issue:code, triage:{}, mechanismHints:{}, measures:{}, doneChecks:{}, scores:{}, branches:[] });

    const flow = $('#rcaFlow');
    flow.innerHTML = `
      <div class="panel">
        <div class="inline" style="justify-content:space-between;gap:8px;flex-wrap:wrap">
          <h3 style="margin:0">Problem: <span style="color:var(--accent)">${data.title}</span></h3>
          <button class="btn small" id="rcaBackIssues">← Change Issue</button>
        </div>
        <p class="help">${data.description||''}</p>
        <div id="triage"></div>
      </div>
      <div id="mechanismBox" class="panel hidden"></div>
      <div id="subsBox" class="panel hidden"></div>
      <div id="diagBox" class="panel hidden"></div>
    `;
    $('#rcaBackIssues').onclick = mountRoot;

    renderTriage(data);
  }

  function renderTriage(data){
    const host = $('#triage');
    host.innerHTML = `
      <h4 style="margin:0 0 8px">Triage</h4>
      <div id="triageItems" class="grid cols-1" style="gap:8px"></div>
      <div class="inline" style="gap:8px;margin-top:10px">
        <button class="btn" id="btnTriageNext">Continue</button>
      </div>
    `;
    const box = $('#triageItems');

    data.triage.forEach(q=>{
      const id = `q_${q.id}`;
      let html = '';
      if(q.type==='choice'){
        html = `
          <div class="panel" id="${id}">
            <div class="title" style="margin-bottom:6px">${q.label}</div>
            <div class="issue-grid">
              ${q.options.map(o=>`<div class="issue-card" data-v="${o.value}"><div class="title">${o.label}</div></div>`).join('')}
            </div>
          </div>`;
      }else{ // chips
        html = `
          <div class="panel" id="${id}">
            <div class="title" style="margin-bottom:6px">${q.label}</div>
            <div class="chips">
              ${q.options.map(o=>`<div class="chip" data-v="${o.value}">${o.label}</div>`).join('')}
            </div>
          </div>`;
      }
      const wrap = document.createElement('div'); wrap.innerHTML = html; box.appendChild(wrap.firstElementChild);

      // bind
      if(q.type==='choice'){
        $$('#'+id+' .issue-card').forEach(card=>{
          card.onclick = ()=>{
            $$('#'+id+' .issue-card').forEach(x=>x.classList.remove('active'));
            card.classList.add('active');
            STATE.triage[q.id] = card.dataset.v;
          };
        });
      }else{
        $$('#'+id+' .chip').forEach(ch=>{
          ch.onclick = ()=>{
            $$('#'+id+' .chip').forEach(x=>x.classList.remove('active'));
            ch.classList.add('active');
            STATE.triage[q.id] = ch.dataset.v;
          };
        });
      }
    });

    $('#btnTriageNext').onclick = ()=>{
      // build weights
      let hints = {};
      data.triage.forEach(q=>{
        const ans = STATE.triage[q.id];
        if(ans && q.score && q.score[ans]) addHint(hints, q.score[ans]);
      });
      STATE.mechanismHints = hints;
      STATE.scores = normScores(hints);
      // choose subsystems branch
      STATE.branches = chooseBranches(data, STATE.triage);

      $('#mechanismBox').classList.remove('hidden');
      renderMechanisms(data);
      $('#subsBox').classList.remove('hidden');
      renderSubsystems(data);
    };
  }

  function chooseBranches(data, triageAnswers){
    // Prefer mapping from data.triageBranch by first answered key; fallback to all subsystems
    const keys = Object.keys(triageAnswers).map(k=>triageAnswers[k]).filter(Boolean);
    for(const k of keys){
      const arr = data.triageBranch?.[k];
      if(Array.isArray(arr) && arr.length) return arr;
    }
    // fallback: if first triage is choice with drying/coating/both (like SetOff) use that
    const first = data.triage?.[0]; const ans = first && triageAnswers[first.id];
    if(ans && data.triageBranch?.[ans]) return data.triageBranch[ans];

    return Object.keys(data.subsystems||{});
  }

  function renderMechanisms(data){
    const host = $('#mechanismBox');
    const scores = STATE.scores || {};
    const items = (data.mechanisms||[]).map(m=>{
      const s = scores[m.id] || 0;
      const pct = Math.round(s*100);
      return `
        <div class="case-card">
          <div class="stripe"></div>
          <div>
            <div class="title">${m.title}</div>
            <div class="meta">Likelihood (internal): <span class="v">${pct}%</span></div>
          </div>
        </div>`;
    }).join('');

    host.innerHTML = `
      <h4 style="margin:0 0 8px">Mechanisms (inferred)</h4>
      <div class="grid cols-1" style="gap:8px">${items || '<div class="help">No mechanisms defined.</div>'}</div>
    `;
  }

  function renderSubsystems(data){
    const host = $('#subsBox');
    const branch = STATE.branches || [];
    const all = data.subsystems || {};
    const cards = branch.map(name=>{
      const ss = all[name]; if(!ss) return '';
      // priority by mechanism score
      const prio = (STATE.scores?.[ss.mechanism]||0);
      const checks = (ss.checks||[]).map(ch=>{
        const cid = `ch_${name}_${ch.id}`;
        const hasSpec = Array.isArray(ch.spec) && ch.spec.length>=2;
        const unit = ch.unit ? `<span class="help" style="margin-left:6px">${ch.unit}</span>` : '';
        return `
          <div class="inline" style="gap:8px; align-items:center">
            <input type="checkbox" id="${cid}_cb">
            <label for="${cid}_cb" style="min-width:240px">${ch.label}${unit}</label>
            <input class="input v13" id="${cid}_in" placeholder="${hasSpec? `${ch.spec[0]} – ${ch.spec[1]}` : 'Value'}" style="max-width:140px" disabled>
            ${hasSpec ? `<span class="chip" id="${cid}_pill">Spec ${ch.spec[0]}–${ch.spec[1]} ${ch.unit||''}</span>` : ''}
          </div>`;
      }).join('');

      return `
        <div class="panel" data-ss="${name}">
          <div class="inline" style="justify-content:space-between; gap:8px; flex-wrap:wrap">
            <div class="title">${name}</div>
            <div class="badge">Priority: ${Math.round(prio*100)}%</div>
          </div>
          <div class="grid cols-1" style="gap:6px; margin-top:8px">${checks}</div>
          ${ss.tips && ss.tips.length ? `<div class="help" style="margin-top:6px">Tips: ${ss.tips.join(' • ')}</div>` : ''}
        </div>`;
    }).join('');

    host.innerHTML = `
      <h4 style="margin:0 0 8px">Subsystem Checks</h4>
      <p class="help">Enable a check to enter a value. Spec range will validate automatically.</p>
      <div class="grid cols-1" style="gap:10px">${cards || '<div class="help">No subsystems for this branch.</div>'}</div>
      <div class="inline" style="gap:8px; margin-top:10px">
        <button class="btn" id="btnDiag">Run Diagnosis</button>
        <button class="btn ghost" id="btnReset">Restart</button>
      </div>
    `;

    // bind enable + live spec
    branch.forEach(name=>{
      const ss = all[name]; if(!ss) return;
      (ss.checks||[]).forEach(ch=>{
        const cid = `ch_${name}_${ch.id}`;
        const cb = document.getElementById(`${cid}_cb`);
        const input = document.getElementById(`${cid}_in`);
        const pill = document.getElementById(`${cid}_pill`);
        cb?.addEventListener('change', ()=>{
          input.disabled = !cb.checked;
          if(cb.checked) input.focus();
          STATE.doneChecks[cid] = !!cb.checked;
          if(!cb.checked){ input.value=''; if(pill) pill.className='chip'; }
        });
        input?.addEventListener('input', ()=>{
          if(!Array.isArray(ch.spec) || ch.spec.length<2){ return; }
          const v = Number(input.value);
          const [min,max] = ch.spec;
          const ok = !Number.isNaN(v) && v>=min && v<=max;
          if(pill){
            pill.textContent = ok ? 'OK' : (Number.isNaN(v)? `Spec ${min}–${max} ${ch.unit||''}` : 'Out of spec');
            pill.className = 'chip ' + (ok ? 'active' : '');
          }
        });
      });
    });

    $('#btnDiag').onclick = ()=> runDiagnosis(data);
    $('#btnReset').onclick = mountRoot;
  }

  function runDiagnosis(data){
    // start from triage hints
    let mech = {...STATE.mechanismHints};
    // add evidence from measurements
    const all = data.subsystems || {};
    for(const ssName of (STATE.branches||[])){
      const ss = all[ssName]; if(!ss) continue;
      (ss.checks||[]).forEach(ch=>{
        const cid = `ch_${ssName}_${ch.id}`;
        const input = document.getElementById(`${cid}_in`);
        const cb = document.getElementById(`${cid}_cb`);
        if(cb && cb.checked){
          const val = input?.value ?? '';
          const delta = scoreFromSpec(val, ch.spec);
          mech[ss.mechanism] = (mech[ss.mechanism]||0) + delta;
          // persist
          STATE.measures[ssName] = STATE.measures[ssName]||{};
          STATE.measures[ssName][ch.id] = val;
        }
      });
    }
    STATE.scores = normScores(mech);

    // build suspects list
    const suspects = Object.keys(STATE.scores).map(k=>({ id:k, score:STATE.scores[k] }))
      .sort((a,b)=> b.score-a.score).slice(0,5);

    const list = suspects.map(s=>{
      const mechName = (data.mechanisms||[]).find(m=>m.id===s.id)?.title || s.id;
      const pct = Math.round(s.score*100);
      return `<div class="case-card"><div class="stripe"></div><div><div class="title">${mechName}</div><div class="meta">Confidence: ${pct}%</div></div></div>`;
    }).join('') || '<div class="help">No suspects.</div>';

    const outOfSpec = [];
    for(const ssName of (STATE.branches||[])){
      const ss = data.subsystems[ssName]; if(!ss) continue;
      (ss.checks||[]).forEach(ch=>{
        const cid = `ch_${ssName}_${ch.id}`;
        const cb = document.getElementById(`${cid}_cb`);
        const input = document.getElementById(`${cid}_in`);
        if(cb && cb.checked && Array.isArray(ch.spec) && ch.spec.length>=2){
          const v = Number(input.value);
          const [min,max]=ch.spec;
          if(!(v>=min && v<=max)){
            outOfSpec.push({ ss:ssName, label:ch.label, val:input.value, spec:ch.spec, unit:ch.unit||'' });
          }
        }
      });
    }

    const diag = $('#diagBox');
    diag.classList.remove('hidden');
    diag.innerHTML = `
      <h4 style="margin:0 0 8px">Diagnosis</h4>
      <div class="grid cols-1" style="gap:8px">
        <div class="panel">
          <div class="title">Top Suspects</div>
          ${list}
        </div>
        <div class="panel">
          <div class="title">Out-of-Spec Findings</div>
          ${outOfSpec.length ? outOfSpec.map(o=>`
            <div class="kv"><span class="k">• ${o.ss}:</span>
              <span class="v">${o.label} = ${o.val} ${o.unit} (Spec ${o.spec[0]}–${o.spec[1]} ${o.unit})</span></div>
          `).join('') : '<div class="help">None found.</div>'}
        </div>
        <div class="panel">
          <div class="title">Suggested Actions</div>
          <div id="rcaActions">${buildActions(data, suspects)}</div>
        </div>
      </div>
      <div class="inline" style="gap:8px; margin-top:10px; flex-wrap:wrap">
        <button class="btn" id="btnCopy">Copy summary</button>
        <button class="btn ghost" id="btnRestart">Restart</button>
      </div>
    `;

    $('#btnRestart').onclick = mountRoot;
    $('#btnCopy').onclick = ()=>{
      const txt = exportSummary(data, suspects, outOfSpec);
      navigator.clipboard.writeText(txt).then(()=> toast('Diagnosis copied','ok'));
    };
  }

  function buildActions(data, suspects){
    const lines=[];
    suspects.slice(0,3).forEach(s=>{
      // take subsystem tips that match mechanism
      const mech = s.id;
      const related = Object.entries(data.subsystems||{})
        .filter(([name,ss])=> ss.mechanism===mech)
        .slice(0,2);
      if(!related.length) return;
      lines.push(`<div class="kv"><span class="k">•</span><span class="v">${(data.mechanisms||[]).find(m=>m.id===mech)?.title||mech}</span></div>`);
      related.forEach(([name,ss])=>{
        const tips = (ss.tips||[]).slice(0,2).map(t=>'– '+t).join('<br>');
        lines.push(`<div class="help" style="margin-left:16px">${name}:<br>${tips||'Review configuration.'}</div>`);
      });
    });
    return lines.join('') || '<div class="help">No actions available.</div>';
  }

  function exportSummary(data, suspects, oos){
    const top = suspects.slice(0,3).map(s=>{
      const name=(data.mechanisms||[]).find(m=>m.id===s.id)?.title||s.id;
      return `- ${name}: ${Math.round(s.score*100)}%`;
    }).join('\n');
    const bad = oos.map(o=>`- ${o.ss}: ${o.label} = ${o.val} ${o.unit} (Spec ${o.spec[0]}–${o.spec[1]} ${o.unit})`).join('\n') || '- None';
    return `Issue: ${data.title}
Triage: ${JSON.stringify(STATE.triage)}
Top suspects:
${top}
Out-of-spec:
${bad}
`;
  }

  // ---------- integration points ----------
  function toast(msg,type='ok'){
    try{
      const t=document.createElement('div'); t.className='toast '+type; t.textContent=msg;
      const w=document.getElementById('toasts')||document.body; (document.getElementById('toasts')||document.body).appendChild(t);
      setTimeout(()=>{t.style.opacity='0'; setTimeout(()=>t.remove(),250)},1600);
    }catch(_){}
  }

  // router hook + onload safe init
  function initWhenVisible(){
    const page = document.getElementById('page-diagnosis');
    if(page && !page.classList.contains('hidden')) mountRoot();
  }

  const prevGo = window.go;
  if (typeof prevGo === 'function') {
    window.go = function(route){
      const r = prevGo.apply(this, arguments);
      if(route==='diagnosis') setTimeout(mountRoot, 0);
      return r;
    };
  }
  document.addEventListener('DOMContentLoaded', initWhenVisible);
})();
