/* /js/wizard.js — V19.5 Guided Flow (Horizontal)
   A + D with hidden B scoring. Single-card, horizontal slide transitions.
   No changes required to HTML/CSS files. Uses existing styles (panel, issue-card, chips, etc.).
   Depends on window.RCA_DATA (from /data/rca-data.js) and window.go router in app.js.
*/

(function(){
  if (window.__LANDA_WIZ_195__) return; window.__LANDA_WIZ_195__ = true;

  // ------- tiny helpers -------
  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const H  = (html)=>{ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstElementChild; };

  // Inject minimal CSS for horizontal transitions (no change to style.css)
  (function injectCSS(){
    const css = `
    .flow-root{position:relative; overflow:hidden; min-height:260px}
    .flow-card{position:absolute; inset:0; opacity:0; transform:translateX(30%); transition:transform .28s ease, opacity .28s ease}
    .flow-card.active{opacity:1; transform:translateX(0)}
    .flow-card.exit-left{opacity:0; transform:translateX(-30%)}
    .flow-progress{display:flex; gap:8px; align-items:center; margin:-6px 0 10px}
    .flow-dot{width:8px; height:8px; border-radius:999px; background:rgba(255,255,255,.15); box-shadow:inset 0 0 0 1px var(--border)}
    .flow-dot.on{background:linear-gradient(180deg, var(--accent), var(--accent2)); box-shadow:0 0 10px rgba(0,174,239,.45)}
    .flow-feedback{margin:8px 0 0; color:var(--muted); font-size:12.5px}
    .flow-cta{display:flex; gap:8px; flex-wrap:wrap; margin-top:12px}
    .flow-mech{display:grid; gap:8px}
    .flow-mech .case-card .meta{font-size:12.5px}
    .flow-ss-cta{display:grid; gap:8px}
    .flow-ss-card{border:1px solid var(--border); border-radius:12px; padding:12px; background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015))}
    .flow-ss-title{display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px}
    .pill{display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border:1px solid var(--border); border-radius:999px; font-size:12px; opacity:.9}
    .pill.ok{border-color:rgba(74,222,128,.5)}
    `;
    const el=document.createElement('style'); el.textContent=css; document.head.appendChild(el);
  })();

  // ------- state -------
  const S = {
    issue:null,            // issue code
    triage:{},             // q.id -> answer
    weights:{},            // mechanism weights (triage)
    scores:{},             // normalized mechanism scores
    branch:[],             // subsystem names to visit (ordered)
    measures:{},           // ss -> {checkId: value}
    done:{},               // enabled checks
    currentSSIndex:0       // index in branch for guided SS checks
  };

  // ------- scoring helpers (B hidden) -------
  function addWeights(dst, src){ for(const k in src){ dst[k]=(dst[k]||0)+Number(src[k]||0); } return dst; }
  function norm(obj){ const v=Object.values(obj); if(!v.length) return {}; const m=Math.max(...v); if(m<=0) return {}; const o={}; for(const k in obj) o[k]=+(obj[k]/m).toFixed(3); return o; }
  function scoreFromSpec(val, spec){
    if(!Array.isArray(spec) || spec.length<2) return 0;
    const num=Number(val); if(Number.isNaN(num)) return 0;
    const [min,max]=spec, span=(max-min)||1;
    if(num>=min && num<=max) return 0.1; // within spec = tiny positive
    const dist=Math.min(Math.abs(num-min), Math.abs(num-max));
    return Math.min(1, Math.max(0.2, dist/span)); // outside spec → suspicion
  }

  // ------- core mount -------
  function mountRoot(){
    const page = document.getElementById('page-diagnosis'); if(!page) return;
    page.innerHTML = `
      <div class="panel">
        <div class="inline" style="justify-content:space-between; gap:8px; flex-wrap:wrap">
          <h2 style="margin:0">Root Cause Analyzer — Guided Flow</h2>
          <div class="flow-progress" id="flowProg">
            <div class="flow-dot on"></div><div class="flow-dot"></div><div class="flow-dot"></div><div class="flow-dot"></div><div class="flow-dot"></div>
          </div>
        </div>
        <p class="help">Answer one step at a time. We’ll guide you horizontally through the shortest path.</p>
        <div class="flow-root" id="flowRoot"></div>
      </div>
    `;
    showCard(buildIssueCard(), true);
    setProg(0);
  }

  // ------- progress -------
  function setProg(idx){
    const dots=$$('#flowProg .flow-dot');
    dots.forEach((d,i)=> d.classList.toggle('on', i<=idx));
  }

  // ------- card transitions -------
  let currentCard = null;
  function showCard(el, instant=false){
    const root = $('#flowRoot'); if(!root) return;
    const prev = currentCard;
    if(prev){
      prev.classList.remove('active');
      prev.classList.add('exit-left');
      setTimeout(()=> prev.remove(), 260);
    }
    el.classList.add('flow-card');
    root.appendChild(el);
    if(instant){
      el.classList.add('active');
    }else{
      setTimeout(()=> el.classList.add('active'), 10);
    }
    currentCard = el;
  }

  // ------- card builders -------
  function buildIssueCard(){
    const el = H(`
      <div class="flow-card">
        <div class="panel" style="margin:0">
          <div class="title" style="margin-bottom:8px">What kind of issue are you facing?</div>
          <div class="issue-grid" id="issuePick">
            <div class="issue-card" data-i="setoff"><div class="title">SetOff</div><div class="sub">Drying / Coating</div></div>
            <div class="issue-card" data-i="scratches"><div class="title">Scratches</div><div class="sub">Surface / Transport</div></div>
            <div class="issue-card" data-i="uniformity"><div class="title">Uniformity</div><div class="sub">Bands / Streaks</div></div>
            <div class="issue-card" data-i="pq"><div class="title">PQ</div><div class="sub">Print Quality</div></div>
          </div>
          <div class="flow-feedback" id="f0"></div>
        </div>
      </div>
    `);
    $$('#issuePick .issue-card', el).forEach(c=>{
      c.onclick = ()=>{
        const code = c.dataset.i;
        const data = window.RCA_DATA?.[code];
        if(!data) return toast('Unknown issue: '+code,'err');
        // reset state
        Object.assign(S, { issue:code, triage:{}, weights:{}, scores:{}, branch:[], measures:{}, done:{}, currentSSIndex:0 });
        $('#f0', el).textContent = `Great. Starting ${data.title} triage…`;
        setTimeout(()=>{ showCard(buildTriageCard(0), false); setProg(1); }, 220);
      };
    });
    return el;
  }

  function buildTriageCard(stepIndex){
    const data = window.RCA_DATA?.[S.issue];
    const q = data?.triage?.[stepIndex];
    if(!q) return buildMechanismCard(); // no more triage → move on

    const el = H(`
      <div class="flow-card">
        <div class="panel">
          <div class="inline" style="justify-content:space-between; gap:8px; flex-wrap:wrap">
            <div class="title">${data.title} — Triage</div>
            <button class="btn small ghost" id="backIssues">← Change Issue</button>
          </div>
          <div style="margin-top:6px"></div>
          <div class="title" style="margin-bottom:8px">${q.label}</div>
          <div id="choices"></div>
          <div class="flow-feedback" id="fb"></div>
          <div class="flow-cta">
            <button class="btn" id="next" disabled>Continue</button>
          </div>
        </div>
      </div>
    `);

    $('#backIssues', el).onclick = ()=>{ mountRoot(); setProg(0); };

    const wrap = $('#choices', el);
    if(q.type==='choice'){
      wrap.innerHTML = `<div class="issue-grid">${q.options.map(o=>`
        <div class="issue-card" data-v="${o.value}"><div class="title">${o.label}</div></div>
      `).join('')}</div>`;
      $$('#choices .issue-card', el).forEach(card=>{
        card.onclick = ()=>{
          $$('#choices .issue-card', el).forEach(x=>x.classList.remove('active'));
          card.classList.add('active');
          S.triage[q.id] = card.dataset.v;
          $('#fb', el).textContent = 'Nice. We captured your response.';
          $('#next', el).disabled = false;
        };
      });
    }else{
      wrap.innerHTML = `<div class="chips">${q.options.map(o=>`<div class="chip" data-v="${o.value}">${o.label}</div>`).join('')}</div>`;
      $$('#choices .chip', el).forEach(ch=>{
        ch.onclick = ()=>{
          $$('#choices .chip', el).forEach(x=>x.classList.remove('active'));
          ch.classList.add('active');
          S.triage[q.id] = ch.dataset.v;
          $('#fb', el).textContent = 'Got it.';
          $('#next', el).disabled = false;
        };
      });
    }

    $('#next', el).onclick = ()=>{
      // scoring hints
      const ans = S.triage[q.id];
      if(ans && q.score && q.score[ans]) addWeights(S.weights, q.score[ans]);
      S.scores = norm(S.weights);
      // move horizontally to next triage or mechanisms
      const nextIndex = stepIndex+1;
      const hasNext = !!data.triage[nextIndex];
      showCard( hasNext ? buildTriageCard(nextIndex) : buildMechanismCard() );
      setProg( hasNext ? 1 : 2 );
    };

    return el;
  }

  function buildMechanismCard(){
    const data = window.RCA_DATA?.[S.issue];
    // choose branch by first relevant triage mapping or fallback to all
    S.branch = chooseBranch(data, S.triage);
    // sort by mechanism score (desc)
    const mechScores = S.scores||{};
    const mechById = (data.mechanisms||[]).reduce((a,m)=>(a[m.id]=m, a),{});
    const mechSorted = (data.mechanisms||[]).slice().sort((a,b)=> (mechScores[b.id]||0)-(mechScores[a.id]||0));

    const el = H(`
      <div class="flow-card">
        <div class="panel">
          <div class="inline" style="justify-content:space-between; gap:8px; flex-wrap:wrap">
            <div class="title">${data.title} — Mechanism Insight</div>
            <button class="btn small ghost" id="backTri">← Triage</button>
          </div>
          <p class="help">We inferred likely mechanisms. Pick one to continue.</p>
          <div class="flow-mech">
            ${mechSorted.map(m=>{
              const pct = Math.round((S.scores?.[m.id]||0)*100);
              return `
              <div class="case-card mech" data-m="${m.id}">
                <div class="stripe"></div>
                <div>
                  <div class="title">${m.title}</div>
                  <div class="meta">Likelihood: ${pct}%</div>
                </div>
              </div>`;
            }).join('')}
          </div>
          <div class="flow-cta">
            <button class="btn" id="letSmart">Let the wizard choose</button>
          </div>
        </div>
      </div>
    `);

    $('#backTri', el).onclick = ()=> showCard(buildTriageCard(0));
    const goSS = (mechId)=>{
      // find first subsystem in branch with this mechanism
      S.currentSSIndex = findFirstIndexByMechanism(data, S.branch, mechId);
      if (S.currentSSIndex<0) S.currentSSIndex = 0;
      showCard(buildSubsystemCard(S.currentSSIndex));
      setProg(3);
    };

    $$('.flow-mech .mech', el).forEach(row=>{
      row.onclick = ()=> goSS(row.dataset.m);
    });
    $('#letSmart', el).onclick = ()=>{
      const best = mechSorted[0]?.id || null;
      goSS(best);
    };

    return el;
  }

  function buildSubsystemCard(i){
    const data = window.RCA_DATA?.[S.issue];
    const branch = S.branch||[];
    const ssName = branch[i];
    const ss = data?.subsystems?.[ssName];
    if(!ss) return buildDiagnosisCard(); // safety

    const prio = Math.round((S.scores?.[ss.mechanism]||0)*100);
    const checksHTML = (ss.checks||[]).map(ch=>{
      const cid = `ch_${ssName}_${ch.id}`;
      const hasSpec = Array.isArray(ch.spec)&&ch.spec.length>=2;
      return `
        <div class="inline" style="gap:8px; align-items:center">
          <input type="checkbox" id="${cid}_cb">
          <label for="${cid}_cb" style="min-width:240px">${ch.label}${ch.unit?` <span class='help' style='margin-left:6px'>${ch.unit}</span>`:''}</label>
          <input class="input v13" id="${cid}_in" placeholder="${hasSpec? `${ch.spec[0]} – ${ch.spec[1]}` : 'Value'}" style="max-width:140px" disabled>
          ${hasSpec? `<span class="pill" id="${cid}_pill">Spec ${ch.spec[0]}–${ch.spec[1]} ${ch.unit||''}</span>`:''}
        </div>
      `;
    }).join('');

    const el = H(`
      <div class="flow-card">
        <div class="panel flow-ss-card">
          <div class="flow-ss-title">
            <div class="title">${ssName}</div>
            <div class="badge">Priority: ${prio}%</div>
          </div>
          <div class="grid cols-1" style="gap:8px">${checksHTML||'<div class="help">No checks defined.</div>'}</div>
          ${ss.tips?.length? `<div class="help" style="margin-top:6px">Tips: ${ss.tips.join(' • ')}</div>`:''}
          <div class="flow-cta">
            ${ i>0 ? `<button class="btn ghost" id="prev">Back</button>`:''}
            ${ i<branch.length-1 ? `<button class="btn" id="next">Next</button>` : `<button class="btn" id="finish">Run Diagnosis</button>`}
          </div>
        </div>
      </div>
    `);

    // bind fields
    (ss.checks||[]).forEach(ch=>{
      const cid = `ch_${ssName}_${ch.id}`;
      const cb   = el.querySelector(`#${cid}_cb`);
      const inp  = el.querySelector(`#${cid}_in`);
      const pill = el.querySelector(`#${cid}_pill`);

      cb?.addEventListener('change', ()=>{
        const on = !!cb.checked;
        inp.disabled = !on;
        if(on){ inp.focus(); } else { inp.value=''; pill && (pill.textContent = pill.textContent.replace(/^OK|Out of spec$/,'').trim()); pill && pill.classList.remove('ok'); }
        S.done[cid] = on;
      });

      inp?.addEventListener('input', ()=>{
        if(Array.isArray(ch.spec) && ch.spec.length>=2){
          const num = Number(inp.value), [min,max]=ch.spec;
          const ok = !Number.isNaN(num) && num>=min && num<=max;
          if(pill){ pill.textContent = ok ? 'OK' : 'Out of spec'; pill.classList.toggle('ok', ok); }
        }
      });
    });

    // nav
    el.querySelector('#prev')?.addEventListener('click', ()=>{
      S.currentSSIndex = Math.max(0, i-1);
      showCard(buildSubsystemCard(S.currentSSIndex));
    });
    el.querySelector('#next')?.addEventListener('click', ()=>{
      S.currentSSIndex = Math.min(branch.length-1, i+1);
      showCard(buildSubsystemCard(S.currentSSIndex));
    });
    el.querySelector('#finish')?.addEventListener('click', ()=>{
      showCard(buildDiagnosisCard());
      setProg(4);
    });

    return el;
  }

  function buildDiagnosisCard(){
    const data = window.RCA_DATA?.[S.issue];
    // accumulate evidence from checks
    const mech = {...S.weights};
    const branch = S.branch||[];
    branch.forEach(name=>{
      const ss = data?.subsystems?.[name]; if(!ss) return;
      (ss.checks||[]).forEach(ch=>{
        const cid = `ch_${name}_${ch.id}`;
        const cb = document.getElementById(`${cid}_cb`);
        const inp = document.getElementById(`${cid}_in`);
        if(cb && cb.checked){
          const v = inp?.value ?? '';
          S.measures[name] = S.measures[name]||{};
          S.measures[name][ch.id] = v;
          mech[ss.mechanism] = (mech[ss.mechanism]||0) + scoreFromSpec(v, ch.spec);
        }
      });
    });
    S.scores = norm(mech);

    const suspects = Object.keys(S.scores).map(id=>({id,score:S.scores[id]})).sort((a,b)=>b.score-a.score).slice(0,5);
    const list = suspects.map(s=>{
      const nm = (data.mechanisms||[]).find(m=>m.id===s.id)?.title || s.id;
      const pct = Math.round(s.score*100);
      return `<div class="case-card"><div class="stripe"></div><div><div class="title">${nm}</div><div class="meta">Confidence: ${pct}%</div></div></div>`;
    }).join('') || '<div class="help">No suspects.</div>';

    const out = [];
    branch.forEach(name=>{
      const ss = data?.subsystems?.[name]; if(!ss) return;
      (ss.checks||[]).forEach(ch=>{
        const cid = `ch_${name}_${ch.id}`;
        const cb = document.getElementById(`${cid}_cb`);
        const inp = document.getElementById(`${cid}_in`);
        if(cb && cb.checked && Array.isArray(ch.spec) && ch.spec.length>=2){
          const num = Number(inp.value), [min,max]=ch.spec;
          if(Number.isNaN(num) || num<min || num>max){
            out.push({ ss:name, label:ch.label, val:inp.value, spec:ch.spec, unit:ch.unit||'' });
          }
        }
      });
    });

    const el = H(`
      <div class="flow-card">
        <div class="panel">
          <div class="title">Diagnosis</div>
          <div class="grid cols-1" style="gap:8px">
            <div class="panel"><div class="title">Top Suspects</div>${list}</div>
            <div class="panel"><div class="title">Out of Spec</div>${
              out.length ? out.map(o=>`<div class="kv"><span class="k">• ${o.ss}:</span><span class="v">${o.label} = ${o.val} ${o.unit} (Spec ${o.spec[0]}–${o.spec[1]} ${o.unit})</span></div>`).join('')
                         : '<div class="help">None</div>'}
            </div>
            <div class="panel"><div class="title">Suggested Actions</div>${buildActions(data, suspects)}</div>
          </div>
          <div class="flow-cta">
            <button class="btn" id="copy">Copy summary</button>
            <button class="btn" id="toCase">Save as Case</button>
            <button class="btn ghost" id="restart">Restart</button>
          </div>
        </div>
      </div>
    `);

    $('#restart', el).onclick = ()=>{ mountRoot(); setProg(0); };
    $('#copy', el).onclick = ()=>{
      const txt = exportSummary(data, suspects, out);
      navigator.clipboard.writeText(txt).then(()=> toast('Diagnosis copied','ok'));
    };
    $('#toCase', el).onclick = ()=>{
      try{
        // Soft prefill for Create Case form (non-destructive)
        go('create');
        setTimeout(()=>{
          const sum = `${data.title} — Top suspects: ` + suspects.slice(0,3).map(s=>{
            const m=(data.mechanisms||[]).find(x=>x.id===s.id)?.title||s.id; return `${m} ${Math.round(s.score*100)}%`;
          }).join(', ');
          const iss = $('#issueSummary'); if(iss) iss.value = sum;
          const notes = $('#notes'); if(notes) notes.value = exportSummary(data, suspects, out);
          toast('Prefilled Create Case','ok');
        }, 60);
      }catch(_){ toast('Open Create Case to save','err'); }
    };

    return el;
  }

  // ------- utilities -------
  function chooseBranch(data, triage){
    const answers = Object.values(triage||{}).filter(Boolean);
    for(const a of answers){
      const arr = data?.triageBranch?.[a];
      if(Array.isArray(arr) && arr.length) return arr.slice();
    }
    // fallback: all subsystems
    return Object.keys(data?.subsystems||{});
  }
  function findFirstIndexByMechanism(data, branch, mechId){
    for(let i=0;i<branch.length;i++){
      const name=branch[i], ss=data?.subsystems?.[name];
      if(ss && ss.mechanism===mechId) return i;
    }
    return -1;
  }
  function buildActions(data, suspects){
    const lines=[];
    suspects.slice(0,3).forEach(s=>{
      const mech=s.id;
      const rel=Object.entries(data.subsystems||{}).filter(([n,ss])=> ss.mechanism===mech).slice(0,2);
      if(!rel.length) return;
      lines.push(`<div class="kv"><span class="k">•</span><span class="v">${(data.mechanisms||[]).find(m=>m.id===mech)?.title||mech}</span></div>`);
      rel.forEach(([n,ss])=>{
        const tips=(ss.tips||[]).slice(0,2).map(t=>'– '+t).join('<br>');
        lines.push(`<div class="help" style="margin-left:16px">${n}:<br>${tips||'Review configuration.'}</div>`);
      });
    });
    return lines.join('') || '<div class="help">No actions available.</div>';
  }
  function exportSummary(data, suspects, oos){
    const top = suspects.slice(0,3).map(s=>{
      const nm=(data.mechanisms||[]).find(m=>m.id===s.id)?.title||s.id;
      return `- ${nm}: ${Math.round(s.score*100)}%`;
    }).join('\n');
    const bad = oos.map(o=>`- ${o.ss}: ${o.label} = ${o.val} ${o.unit} (Spec ${o.spec[0]}–${o.spec[1]} ${o.unit})`).join('\n') || '- None';
    return `Issue: ${data.title}
Triage: ${JSON.stringify(S.triage)}
Top suspects:
${top}
Out-of-spec:
${bad}
`;
  }
  function toast(msg,type='ok'){
    try{
      const t=document.createElement('div'); t.className='toast '+type; t.textContent=msg;
      const w=document.getElementById('toasts')||document.body; w.appendChild(t);
      setTimeout(()=>{t.style.opacity='0'; setTimeout(()=>t.remove(),250)},1600);
    }catch(_){}
  }

  // ------- router hook & initial mount -------
  const prevGo = window.go;
  if(typeof prevGo==='function'){
    window.go = function(route){
      const r = prevGo.apply(this, arguments);
      if(route==='diagnosis') setTimeout(mountRoot, 0);
      return r;
    };
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    const page = document.getElementById('page-diagnosis');
    if(page && !page.classList.contains('hidden')) mountRoot();
  });
})();
