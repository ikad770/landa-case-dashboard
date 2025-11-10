/* Landa Quantum – Root Cause Analyzer (V18.9-Pro)
   Wizard + Spec-aware checks, compact IPU/Extrusion grids
   Requires: SET_OFF_DATA in ./data/setoff.js  */

(function(){
  if (window.__LANDA_RCA__) return; window.__LANDA_RCA__ = true;

  // ---- tiny dom helpers ----
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  function h(t,a={},c=[]){ const e=document.createElement(t);
    Object.entries(a).forEach(([k,v])=>{
      if(k==='class')e.className=v; else if(k==='text')e.textContent=v;
      else if(k==='style')e.setAttribute('style',v);
      else if(k.startsWith('on')&&typeof v==='function')e.addEventListener(k.slice(2),v);
      else e.setAttribute(k,v);
    });
    (Array.isArray(c)?c:[c]).forEach(ch=>{ if(ch==null)return; typeof ch==='string'?e.appendChild(document.createTextNode(ch)):e.appendChild(ch); });
    return e;
  }

  // ---- minimal scoped CSS (לא משנה את העיצוב הכללי) ----
  const css = `
  #rcaRoot .progress{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px}
  #rcaRoot .step{padding:6px 10px;border:1px solid var(--border);border-radius:999px;opacity:.9}
  #rcaRoot .step.active{background:linear-gradient(180deg, rgba(0,174,239,.28), rgba(0,174,239,.08));border-color:rgba(0,174,239,.55)}
  #rcaRoot .tabs{display:flex;gap:8px;flex-wrap:wrap}
  #rcaRoot .tabs .chip{cursor:pointer}
  .rca-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:12px}
  .pill{padding:2px 8px;border:1px solid var(--border);border-radius:999px;font-size:12px}
  .pill.ok{border-color:rgba(74,222,128,.55)} .pill.bad{border-color:rgba(255,73,103,.6)}
  .mini-bar{height:6px;border:1px solid var(--border);border-radius:6px;background:rgba(255,255,255,.05);position:relative;min-width:110px}
  .mini-bar .val{position:absolute;top:-4px;height:14px;width:2px;background:#bfe9ff;border-radius:2px;box-shadow:0 0 8px rgba(0,174,239,.45)}
  .mini-bar .rng{position:absolute;top:1px;bottom:1px;border-radius:6px;background:rgba(74,222,128,.25)}
  .grid.compact{display:grid;grid-template-columns:repeat(auto-fit, minmax(160px,1fr));gap:8px}
  `;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  // ---- data normalize ----
  function norm(){
    const raw = (typeof SET_OFF_DATA!=='undefined')?SET_OFF_DATA:null;
    if(!raw) return null;
    const subs = raw.subsystems || raw.Subsystems || {};
    const keys = Object.keys(subs);
    const has = n => keys.includes(n);
    const branch = window.BRANCH_MAP || {
      drying: ['IRD','STS','Powder','IRD X'].filter(has),
      coating:['ICS','BCS'].filter(has),
      both: keys
    };
    return {subs, branch};
  }

  // ---- SPEC helpers ----
  function parseSpec(tok){
    if(!tok && tok!==0) return null;
    const s=String(tok).trim();
    const m = s.match(/^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/);
    if(m) return {min:+m[1], max:+m[2]};
    if(/^-?\d+(?:\.\d+)?$/.test(s)) return {target:+s};
    return null;
  }
  function pill(ok){ if(ok==null) return h('span',{class:'pill'},'—'); return ok?h('span',{class:'pill ok'},'Within spec'):h('span',{class:'pill bad'},'Out of spec'); }
  function miniBar(spec,val){
    if(!spec || (typeof spec.min!=='number' && typeof spec.max!=='number')) return null;
    const min = typeof spec.min==='number'?spec.min:(spec.target-1||0);
    const max = typeof spec.max==='number'?spec.max:(spec.target+1||1);
    const w = h('div',{class:'mini-bar'}), rng=h('div',{class:'rng'}), v=h('div',{class:'val'});
    // clamp rng to spec range
    const l=0, r=100; rng.style.left='2%'; rng.style.right='2%';
    w.appendChild(rng); w.appendChild(v);
    function place(x){ const n=Number(x); if(!isFinite(n)){v.style.left='-9999px';return;}
      const p = Math.max(0, Math.min(100, ( (n-min)*100/(max-min) )));
      v.style.left=`calc(${p}% - 1px)`;
    }
    place(val); w._place=place; return w;
  }
  function within(val,spec){
    if(!spec) return null; const n=Number(val); if(!isFinite(n)) return null;
    if(typeof spec.min==='number' && n<spec.min) return false;
    if(typeof spec.max==='number' && n>spec.max) return false;
    if(typeof spec.target==='number') return Math.abs(n-spec.target)<=1e-9;
    return true;
  }

  // ---- Build page ----
  function build(host){
    host.innerHTML='';
    const root=h('div',{id:'rcaRoot'});

    root.appendChild(h('div',{class:'panel'},[
      h('h2',{text:'Root Cause Analyzer – Fishbone Troubleshooter',style:'margin:0 0 10px'}),
      h('p',{class:'help',text:'בחר בעיה → בחר ענף → מלא רק מה שרלוונטי. אם יש SPEC נקבל חיווי בזמן אמת. בסוף — דיאגנוזה והמלצות.'})
    ]));

    const prog=h('div',{class:'panel',style:'margin-top:10px'},[
      h('div',{class:'progress'},[
        h('div',{class:'step active',id:'st1'},'Issue'),
        h('div',{class:'step',id:'st2'},'Branch'),
        h('div',{class:'step',id:'st3'},'Subsystems'),
        h('div',{class:'step',id:'st4'},'Diagnosis')
      ]),
      h('div',{class:'issue-grid'},[
        card('SetOff','Drying / Coating',()=>chooseIssue('setoff')),
        card('Scratches','Print / Blanket',()=>coming()),
        card('Uniformity','Density / Bands',()=>coming()),
        card('Jetting','Nozzles / Missing',()=>coming()),
        card('Transfer','Media / Adhesion',()=>coming())
      ])
    ]);
    root.appendChild(prog);

    const branchBox=h('div',{class:'panel hidden',id:'branchBox',style:'margin-top:10px'},[
      h('div',{class:'inline',style:'gap:8px;align-items:center;flex-wrap:wrap'},[
        h('div',{class:'title',text:'Select branch:'}),
        chip('Drying',()=>pick('drying'),true),
        chip('Coating',()=>pick('coating')),
        chip('Both',()=>pick('both'))
      ]),
      h('div',{class:'help',text:'אפשר להחליף ענף בכל רגע — התוכן יתעדכן בהתאם.'})
    ]);
    root.appendChild(branchBox);

    const subsWrap=h('div',{id:'subsWrap',class:'hidden',style:'margin-top:10px'});
    root.appendChild(subsWrap);

    const actions=h('div',{class:'rca-actions hidden',id:'rcaActions'},[
      h('button',{class:'btn',onclick:runDiag},'Run Diagnosis'),
      h('button',{class:'btn ghost',onclick:reset},'Restart')
    ]);
    root.appendChild(actions);

    host.appendChild(root);

    function card(t, s, on){ return h('div',{class:'issue-card',onclick:on},[h('div',{class:'title',text:t}),h('div',{class:'sub',text:s})]); }
    function chip(t,on,active=false){ const el=h('div',{class:'chip'+(active?' active':''),onclick:()=>{
      $$('#branchBox .chip').forEach(c=>c.classList.remove('active')); el.classList.add('active'); on();
    }},t); return el; }
    function coming(){ alert('יתוסף בקרוב'); }

    let currentBranch=null;

    function chooseIssue(){
      $('#st1').classList.remove('active'); $('#st2').classList.add('active');
      branchBox.classList.remove('hidden');
    }

    function pick(kind){
      currentBranch=kind; $('#st3').classList.add('active');
      renderSubsystems(kind);
    }

    function reset(){
      subsWrap.innerHTML=''; subsWrap.classList.add('hidden');
      branchBox.classList.add('hidden'); $('#rcaActions').classList.add('hidden');
      $$('#rcaRoot .step').forEach(s=>s.classList.remove('active')); $('#st1').classList.add('active');
    }

    function renderSubsystems(kind){
      const data=norm();
      subsWrap.classList.remove('hidden'); subsWrap.innerHTML='';
      if(!data){ subsWrap.innerHTML='<div class="panel">Data not loaded (./data/setoff.js)</div>'; return; }

      const {subs,branch}=data;
      const names=(branch[kind]||[]).filter(n=>subs[n]);
      if(!names.length){ subsWrap.innerHTML='<div class="panel">No subsystems for this branch.</div>'; return; }

      const tabs=h('div',{class:'panel'},[
        h('div',{class:'inline',style:'gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap'},[
          h('div',{class:'tabs',id:'tabs'}),
          h('input',{class:'input v13',id:'q',placeholder:'Search checks…',style:'max-width:220px'})
        ])
      ]);
      const content=h('div',{id:'subsContent'});
      subsWrap.appendChild(tabs); subsWrap.appendChild(content);

      names.forEach((nm,i)=>{
        $('#tabs').appendChild(tabChip(nm,i===0,()=>show(nm)));
        content.appendChild(buildPanel(nm, subs[nm]));
      });
      if(names.length) show(names[0]);

      $('#q').addEventListener('input',()=>{
        const q=$('#q').value.toLowerCase();
        $$('#subsContent .panel').forEach(p=>{
          const hit=(p.dataset.q||''); p.style.display=hit.includes(q)?'block':'none';
        });
      });

      $('#rcaActions').classList.remove('hidden');

      function tabChip(name, active, onClick){
        const lab = String(name).replace(/\s+/g,' ').trim();
        const el= h('div',{class:'chip'+(active?' active':''),onclick:()=>{
          $$('#tabs .chip').forEach(c=>c.classList.remove('active')); el.classList.add('active'); onClick();
        }}, lab);
        return el;
      }
      function show(name){ $$('#subsContent .panel').forEach(p=>p.style.display='none');
        const el = $(`#subsContent .panel[data-name="${CSS.escape(name)}"]`); if(el) el.style.display='block'; }
    }

    function buildPanel(name,node){
      const wrap=h('div',{class:'panel','data-name':name});
      wrap.appendChild(h('h3',{text:name}));
      let qbuf=name.toLowerCase()+' ';
      // "IRD" and "IRD X" compact grids:
      if(/^IRD\s*$/i.test(name)){ wrap.appendChild(buildIPU(node)); wrap.dataset.q=qbuf+' ipu'; return wrap; }
      if(/^IRD\s*X$/i.test(name)){ wrap.appendChild(buildExtrusions(node)); wrap.dataset.q=qbuf+' extrusion'; return wrap; }

      // generic: object with sections OR array of rows
      let rows=null;
      if(Array.isArray(node)) rows=node;
      else if (node && Array.isArray(node.checks)) rows=node.checks;

      if(rows){
        wrap.appendChild(buildList(rows, t=>qbuf+=t));
        wrap.dataset.q=qbuf; return wrap;
      }
      if(node && typeof node==='object'){
        Object.entries(node).forEach(([sec, list])=>{
          wrap.appendChild(h('div',{class:'title',text:sec,style:'margin:6px 0 2px'}));
          wrap.appendChild(buildList(list, t=>qbuf+=t));
          qbuf+=' '+String(sec||'').toLowerCase();
        });
        wrap.dataset.q=qbuf; return wrap;
      }
      wrap.appendChild(h('div',{class:'help',text:'No checks.'}));
      return wrap;
    }

    function buildIPU(node){
      // expect node like: { checks:[{label:'IPU 1', spec:['a-b','unit']}, ...] } or array
      const rows = Array.isArray(node?.checks)?node.checks: (Array.isArray(node)?node:[]);
      const labels = rows.length? rows.map(r=>r.label||r.check||'') : Array.from({length:7},(_,i)=>`IPU ${i+1}`);
      const grid=h('div',{class:'grid compact'});
      labels.forEach((lab,i)=>{
        const specTok = rows[i]?.spec?.[0]; const spec=parseSpec(specTok);
        const card=h('div',{class:'panel',style:'padding:10px'});
        card.appendChild(h('div',{class:'title',text:lab}));
        const line=h('div',{class:'inline',style:'gap:6px;align-items:center;margin-top:6px;flex-wrap:wrap'});
        const cb=h('input',{type:'checkbox'});
        const input=h('input',{class:'input v13',placeholder:'Value',style:'max-width:120px',disabled:true});
        const mb=miniBar(spec,null); let p=pill(null);
        cb.addEventListener('change',()=>{ input.disabled=!cb.checked; });
        input.addEventListener('input',()=>{
          const ok=within(input.value,spec); const np=pill(ok); p.replaceWith(np); p=np; if(mb&&mb._place) mb._place(input.value);
        });
        line.appendChild(cb); line.appendChild(input); if(mb) line.appendChild(mb); line.appendChild(p);
        card.appendChild(line); grid.appendChild(card);
      });
      return grid;
    }

    function buildExtrusions(node){
      const rows = Array.isArray(node?.checks)?node.checks: (Array.isArray(node)?node:[]);
      const labels = rows.length? rows.map(r=>r.label||r.check||'') : Array.from({length:11},(_,i)=>`Extrusion ${i+1}`);
      const grid=h('div',{class:'grid compact'});
      labels.forEach((lab,i)=>{
        const specTok = rows[i]?.spec?.[0]; const spec=parseSpec(specTok);
        const card=h('div',{class:'panel',style:'padding:10px'});
        card.appendChild(h('div',{class:'title',text:lab}));
        const line=h('div',{class:'inline',style:'gap:6px;align-items:center;margin-top:6px;flex-wrap:wrap'});
        const cb=h('input',{type:'checkbox'});
        const input=h('input',{class:'input v13',placeholder:'Value',style:'max-width:120px',disabled:true});
        const mb=miniBar(spec,null); let p=pill(null);
        cb.addEventListener('change',()=>{ input.disabled=!cb.checked; });
        input.addEventListener('input',()=>{
          const ok=within(input.value,spec); const np=pill(ok); p.replaceWith(np); p=np; if(mb&&mb._place) mb._place(input.value);
        });
        line.appendChild(cb); line.appendChild(input); if(mb) line.appendChild(mb); line.appendChild(p);
        card.appendChild(line); grid.appendChild(card);
      });
      return grid;
    }

    function buildList(list, addQ){
      const box=h('div',{class:'grid cols-1',style:'gap:8px;margin-top:6px'});
      (list||[]).forEach((row,idx)=>{
        const label = (row&&typeof row==='object')?(row.label||row.check||`Check ${idx+1}`):String(row||`Check ${idx+1}`);
        const unit = row?.unit?String(row.unit):'';
        const specTok=row?.spec?.[0]; const spec=parseSpec(specTok);
        const line=h('div',{class:'inline',style:'gap:8px;align-items:center;flex-wrap:wrap'});
        const cb=h('input',{type:'checkbox'}); line.appendChild(cb);
        line.appendChild(h('span',{text:label}));
        // if no SPEC and not marked free → free text disabled until checked (בלי בר/חיווי)
        const input=h('input',{class:'input v13',placeholder:(unit||'Value'),style:'max-width:160px',disabled:true});
        let p=pill(spec?null:null); // אם אין SPEC – נראה מקף
        const bar = spec? miniBar(spec,null) : null;
        const info=h('div',{class:'inline',style:'gap:6px;align-items:center;flex-wrap:wrap'});
        info.appendChild(input); if(unit) info.appendChild(h('span',{class:'help',text:unit}));
        if(bar) info.appendChild(bar); info.appendChild(p);
        line.appendChild(info);

        cb.addEventListener('change',()=>{ input.disabled=!cb.checked; });
        input.addEventListener('input',()=>{
          const ok = spec? within(input.value,spec) : null;
          const np=pill(ok); p.replaceWith(np); p=np; if(bar&&bar._place) bar._place(input.value);
        });

        box.appendChild(line);
        if(addQ) addQ(' '+label.toLowerCase());
      });
      return box;
    }

    // ---- Diagnosis ----
    function runDiag(){
      const rep = analyze(collect());
      showDiag(rep); $('#st4').classList.add('active');
    }

    function collect(){
      const data={branch:($('#branchBox .chip.active')?.textContent||'').toLowerCase(), subs:{}};
      $$('#subsContent .panel').forEach(p=>{
        const name=p.getAttribute('data-name'); const items=[];
        $$('div.inline',p).forEach(row=>{
          const cb=$('input[type="checkbox"]',row); const enabled=!!(cb&&cb.checked);
          const labelEl=row.parentElement.querySelector('span'); const label=labelEl?labelEl.textContent.trim():'';
          const inp=$('input.input.v13',row); const val=inp?inp.value.trim():'';
          const pillEl=$('.pill',row); const status=pillEl?(pillEl.classList.contains('bad')?'out':(pillEl.classList.contains('ok')?'ok':'n/a')):'n/a';
          items.push({label,enabled,value:val,status});
        });
        data.subs[name]=items;
      });
      return data;
    }

    function analyze(data){
      const out={branch:data.branch,subs:{},totals:{enabled:0,filled:0,out:0},summary:[],recommendations:[]};
      Object.entries(data.subs).forEach(([name,items])=>{
        const rec={enabled:0,filled:0,out:0};
        items.forEach(x=>{ if(x.enabled) rec.enabled++; if(x.enabled && x.value) rec.filled++; if(x.enabled && x.value && x.status==='out') rec.out++; });
        out.subs[name]=rec; out.totals.enabled+=rec.enabled; out.totals.filled+=rec.filled; out.totals.out+=rec.out;
        if(rec.enabled>0) out.summary.push(`${name}: ${rec.out}/${rec.filled} out-of-spec`);
      });
      const worst=Object.entries(out.subs).sort((a,b)=>b[1].out-a[1].out)[0];
      if(worst){
        const k=worst[0].toLowerCase();
        if(k.includes('ird')) out.recommendations.push('בדוק כיולי IRD ו־IPU balance; זרימת פליטה/אוויר.');
        if(k.includes('sts')) out.recommendations.push('בדוק מאווררי STS וחיישני טמפרטורה; שקול רה־קליברציה.');
        if(k.includes('powder')) out.recommendations.push('אמת קצב אבקה/לחץ משאבה; נקה נחירים.');
        if(k.includes('ics')||k.includes('bcs')) out.recommendations.push('אמת צמיגות/פרופיל לכה ו־UV/IR.');
      }
      if(out.totals.out===0 && out.totals.filled>0) out.recommendations.push('הכל בתחום SPEC. בדוק מדיה/הגדרות; אפשר לשקול העלאת תפוקה.');
      return out;
    }

    function showDiag(rep){
      let back=$('#modalBack'), mod=$('#modal');
      if(!back||!mod){ back=h('div',{class:'modal-back',id:'modalBack'}); mod=h('div',{class:'modal',id:'modal'}); back.appendChild(mod); document.body.appendChild(back); }
      mod.innerHTML='';
      mod.appendChild(h('div',{class:'title',text:'Smart Diagnosis'}));
      const body=h('div',{style:'margin-top:12px'}); mod.appendChild(body);

      body.appendChild(h('div',{class:'panel'},[
        h('div',{class:'kv'},[h('span',{class:'k',text:'Branch:'}),h('span',{class:'v',text:String((rep.branch||'').toUpperCase())})]),
        h('div',{class:'kv'},[h('span',{class:'k',text:'Summary:'}),h('span',{class:'v',text:rep.summary.join(' | ')||'No checks enabled'})]),
        h('div',{class:'kv'},[h('span',{class:'k',text:'Totals:'}),h('span',{class:'v',text:`Enabled ${rep.totals.enabled}, Filled ${rep.totals.filled}, Out-of-spec ${rep.totals.out}`})])
      ]));
      body.appendChild(h('div',{class:'panel',style:'margin-top:10px'},[
        h('h3',{text:'Recommendations'}),
        rep.recommendations.length ? h('ul',{},rep.recommendations.map(r=>h('li',{text:r}))) : h('div',{class:'help',text:'No specific recommendations.'})
      ]));
      body.appendChild(h('div',{class:'rca-actions'},[
        h('button',{class:'btn primary',onclick:()=>saveAsCase(rep)},'Save as Case'),
        h('button',{class:'btn small danger',onclick:()=>{ back.style.display='none'; }},'Close')
      ]));

      back.style.display='flex';
    }

    function saveAsCase(rep){
      try{
        if(typeof go==='function') go('create');
        setTimeout(()=>{
          const issue=$('#issueSummary'), sol=$('#solution'), sym=$('#symptoms');
          if(issue) issue.value=`RCA: ${String(rep.branch||'').toUpperCase()} | ${rep.summary.join(' | ')}`;
          if(sym) sym.value=(rep.recommendations||[]).map(x=>'• '+x).join('\n');
          if(sol) sol.value='בצע את ההמלצות המובילות, מדוד מחדש והרץ RCA חוזר.';
          if(typeof toast==='function') toast('Diagnosis copied to new case','ok');
        },60);
      }catch(e){
        const blob=new Blob([JSON.stringify(rep,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='diagnosis.json'; a.click();
      }
      const back=$('#modalBack'); if(back) back.style.display='none';
    }
  } // build

  // expose init + hook router
  window.initRootCause=function(){
    const page=document.getElementById('page-diagnosis'); if(!page) return;
    let host=document.getElementById('diagContainer'); if(!host){ host=h('div',{id:'diagContainer'}); page.innerHTML=''; page.appendChild(host); }
    build(host);
  };
  const _go=window.go;
  if(typeof _go==='function'){
    window.go=function(route){ const r=_go.apply(this,arguments); if(route==='diagnosis') setTimeout(window.initRootCause,0); return r; }
  }
  document.addEventListener('DOMContentLoaded',()=>{ const pg=document.getElementById('page-diagnosis'); if(pg && !pg.classList.contains('hidden')) window.initRootCause(); });

  // legacy support: startDiagnosis('setoff')
  window.startDiagnosis=function(){ if(!document.getElementById('rcaRoot')) window.initRootCause(); setTimeout(()=>{ document.querySelector('#rcaRoot .issue-card')?.click(); document.querySelector('#branchBox .chip')?.click(); },0); };
})();
