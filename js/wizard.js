// /js/wizard.js
// Fishbone Wizard Pro – multi-issue, animated, spec-aware. No global CSS changes (scoped).

(function(){
  if (window.__LANDA_WIZARD__) return; window.__LANDA_WIZARD__ = true;
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const h=(t,a={},c=[])=>{ const e=document.createElement(t);
    for(const [k,v] of Object.entries(a||{})){
      if(k==='class') e.className=v; else if(k==='text') e.textContent=v; else if(k==='style') e.setAttribute('style',v);
      else if(k.startsWith('on') && typeof v==='function') e.addEventListener(k.slice(2), v); else e.setAttribute(k,v);
    }
    (Array.isArray(c)?c:[c]).forEach(n=>{ if(n==null)return; typeof n==='string'?e.appendChild(document.createTextNode(n)):e.appendChild(n); });
    return e;
  };

  // Scoped cosmetics (no global override)
  const css = `
  #fbPro .hero{display:grid;gap:10px}
  #fbPro .select-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
  #fbPro .card{padding:16px;border:1px solid var(--border);border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));box-shadow:0 14px 34px rgba(0,0,0,.32);cursor:pointer;transition:.2s;position:relative;overflow:hidden}
  #fbPro .card:hover{transform:translateY(-2px);border-color:rgba(59,208,255,.45);box-shadow:0 22px 56px rgba(0,174,239,.28)}
  #fbPro .card .title{font-weight:700;margin:0 0 4px}
  #fbPro .card .sub{color:var(--muted);font-size:12.5px}
  #fbPro .ring{position:absolute;right:-20px;top:-20px;width:120px;height:120px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,174,239,.24),transparent 70%)}
  #fbPro .progress{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
  #fbPro .step{padding:6px 10px;border:1px solid var(--border);border-radius:999px}
  #fbPro .step.active{background:linear-gradient(180deg, rgba(0,174,239,.28), rgba(0,174,239,.08));border-color:rgba(0,174,239,.55)}
  #fbPro .crumbs{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}
  #fbPro .crumb{padding:3px 8px;border:1px solid var(--border);border-radius:999px;font-size:12px}
  #fbPro .opt{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--border);border-radius:12px;padding:10px 12px;background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015));cursor:pointer}
  #fbPro .opt:hover{transform:translateY(-1px);box-shadow:0 14px 30px rgba(0,0,0,.35);border-color:rgba(59,208,255,.35)}
  #fbPro .ask{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end}
  #fbPro .mini-bar{height:6px;border:1px solid var(--border);border-radius:6px;background:rgba(255,255,255,.05);position:relative;min-width:140px}
  #fbPro .mini-bar .val{position:absolute;top:-4px;height:14px;width:2px;background:#bfe9ff;border-radius:2px;box-shadow:0 0 8px rgba(0,174,239,.45)}
  #fbPro .pill{padding:2px 8px;border:1px solid var(--border);border-radius:999px;font-size:12px}
  #fbPro .pill.ok{border-color:rgba(74,222,128,.55)} #fbPro .pill.warn{border-color:rgba(255,196,0,.6)} #fbPro .pill.bad{border-color:rgba(255,73,103,.6)}
  #fbPro .tabs{display:flex;gap:8px;flex-wrap:wrap}
  #fbPro .tabs .chip{cursor:pointer}
  #fbPro .grid.compact{display:grid;grid-template-columns:repeat(auto-fit, minmax(170px,1fr));gap:8px}
  `;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  // Helpers
  function parseSpec(tok){ if(!tok&&tok!==0) return null; const s=String(tok).trim(); const m=s.match(/^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/); if(m) return {min:+m[1],max:+m[2]}; if(/^-?\d+(?:\.\d+)?$/.test(s)) return {target:+s}; return null; }
  function withinSpec(val,spec){ if(!spec) return null; const n=Number(val); if(!isFinite(n)) return null;
    if(typeof spec.min==='number'&&n<spec.min) return false;
    if(typeof spec.max==='number'&&n>spec.max) return false;
    if(typeof spec.target==='number'){ const d=Math.abs(n-spec.target); if(d<1e-9) return true; return d<=0.5 ? 'warn' : false; }
    return true;
  }
  const pill=(state)=> state==null?h('span',{class:'pill'},'—'):(state===true?h('span',{class:'pill ok'},'Within'):state==='warn'?h('span',{class:'pill warn'},'Borderline'):h('span',{class:'pill bad'},'Out'));
  function miniBar(spec,val){ if(!spec||(typeof spec.min!=='number'&&typeof spec.max!=='number')) return null;
    const min=typeof spec.min==='number'?spec.min:(spec.target-1||0); const max=typeof spec.max==='number'?spec.max:(spec.target+1||1);
    const w=h('div',{class:'mini-bar'}), v=h('div',{class:'val'}); w.appendChild(v);
    function place(x){ const n=Number(x); if(!isFinite(n)){v.style.left='-9999px';return;} const p=Math.max(0,Math.min(100,((n-min)*100/(max-min)))); v.style.left=`calc(${p}% - 1px)`; }
    place(val); w._place=place; return w;
  }
  function specFromGlobal(key){ try{ const g=(typeof SET_OFF_DATA!=='undefined'&&SET_OFF_DATA.spec)?SET_OFF_DATA.spec[key]:null; return g?parseSpec(g):null; }catch{return null;} }
  function getSub(name){ const raw=(typeof SET_OFF_DATA!=='undefined')?SET_OFF_DATA:null; const subs=raw?.subsystems||raw?.Subsystems||{}; return subs?.[name]||null; }

  // Default SetOff tree (used if RCA_DATA.setoff.tree is missing)
  const DEFAULT_SETOFF = {
    root:{ type:'q', title:'SetOff — quick A/B drying check', text:'Print same job with & without coating. Which sample is under-dried?', options:[
      {label:'Without coating', next:'drying'}, {label:'With coating', next:'coating'}, {label:'Both', next:'both'} ]},
    nodes:{
      drying:{ type:'ask', title:'Temperature after IRD (°C)', text:'Measure after last IRD zone.', unit:'°C', specFrom:'IRD_Temp',
        routes:[ {when:'<',value:60,next:'drying_low'}, {when:'>=',value:60,next:'ask_humidity'} ] },
      ask_humidity:{ type:'ask', title:'Humidity / exhaust at drying area (%)', text:'Measure near exhaust.', unit:'%', routes:[
        {when:'>',value:55,next:'drying_flow'}, {when:'<=',value:55,next:'leaf_drying'} ] },
      drying_low:{ type:'q', title:'Likely IRD under-performance', text:'Next focus:', options:[
        {label:'IRD / IPU', next:'leaf_IRD'}, {label:'STS (fans / temperature)', next:'leaf_STS'} ] },
      drying_flow:{ type:'q', title:'Likely airflow / exhaust bottleneck', text:'Verify STS & Powder.', options:[
        {label:'STS checklist', next:'leaf_STS'}, {label:'Powder checklist', next:'leaf_Powder'} ] },
      coating:{ type:'q', title:'Coating system', text:'Inspect first:', options:[
        {label:'ICS', next:'leaf_ICS'}, {label:'BCS', next:'leaf_BCS'}, {label:'IRD X (Extrusions)', next:'leaf_IRDX'} ] },
      both:{ type:'q', title:'Both samples under-dried', text:'Start broad:', options:[
        {label:'IRD / IPU',next:'leaf_IRD'},{label:'STS',next:'leaf_STS'},{label:'Powder',next:'leaf_Powder'},{label:'ICS',next:'leaf_ICS'},{label:'BCS',next:'leaf_BCS'},{label:'IRD X',next:'leaf_IRDX'} ] },
      leaf_IRD:{type:'leaf',title:'IRD / IPU',subs:['IRD']}, leaf_STS:{type:'leaf',title:'STS',subs:['STS']}, leaf_Powder:{type:'leaf',title:'Powder',subs:['Powder']},
      leaf_ICS:{type:'leaf',title:'ICS',subs:['ICS']},  leaf_BCS:{type:'leaf',title:'BCS',subs:['BCS']}, leaf_IRDX:{type:'leaf',title:'IRD X',subs:['IRD X']},
      leaf_drying:{type:'leaf',title:'Drying — Checklist',subs:['IRD','STS','Powder']}
    }
  };

  function build(host){
    host.innerHTML='';
    const root=h('div',{id:'fbPro'});

    // Hero / Selector
    root.appendChild(h('div',{class:'panel hero'},[
      h('h2',{text:'Root Cause Analyzer – Pro Wizard',style:'margin:0'}),
      h('p',{class:'help',text:'Select issue → branch via smart Q&A → run checks with live SPEC → instant diagnosis.'}),
      h('div',{class:'select-grid'},[
        card('SetOff','Drying / Coating','setoff'),
        card('Scratches','Surface / Transport','scratches'),
        card('Uniformity','Bands / Streaks / Mottle','uniformity'),
        card('PQ','Print Quality','pq')
      ])
    ]));

    const prog=h('div',{class:'panel',style:'margin-top:10px;display:none'},[
      h('div',{class:'progress'},[
        h('div',{class:'step active',id:'p1'},'Issue'),
        h('div',{class:'step',id:'p2'},'Fishbone'),
        h('div',{class:'step',id:'p3'},'Checks'),
        h('div',{class:'step',id:'p4'},'Diagnosis')
      ])
    ]);
    const box=h('div',{class:'panel',id:'box',style:'margin-top:10px;display:none'});
    const actions=h('div',{class:'inline',style:'gap:8px;justify-content:flex-end;margin-top:10px;display:none'},[
      h('button',{class:'btn ghost',onclick:()=>init()},'Start over')
    ]);

    root.appendChild(prog); root.appendChild(box); root.appendChild(actions);
    host.appendChild(root);

    let ACTIVE={issue:'',tree:null,path:[],measures:{}};

    function card(title,sub,code){
      return h('div',{class:'card',onclick:()=>start(code)},[
        h('div',{class:'ring'}), h('div',{class:'title',text:title}), h('div',{class:'sub',text:sub})
      ]);
    }
    function init(){
      ACTIVE={issue:'',tree:null,path:[],measures:{}};
      $$('.step',prog).forEach(s=>s.classList.remove('active')); $('#p1').classList.add('active');
      host.querySelector('.hero').style.display='grid';
      prog.style.display='none'; box.style.display='none'; actions.style.display='none';
    }
    function start(code){
      ACTIVE.issue=code;
      const userTree = (window.RCA_DATA && window.RCA_DATA[code] && window.RCA_DATA[code].tree) || null;
      ACTIVE.tree = userTree || (code==='setoff' ? DEFAULT_SETOFF : null);
      host.querySelector('.hero').style.display='none';
      prog.style.display='block'; box.style.display='block'; actions.style.display='flex';
      ACTIVE.path=['root']; ACTIVE.measures={};
      render('root');
    }

    function render(id){
      const T = ACTIVE.tree;
      if(!T){ box.innerHTML = `<div class="help">No decision tree yet for "${ACTIVE.issue.toUpperCase()}". Upload data to /data/rca-data.js</div>`; return; }
      const node = (id==='root') ? T.root : T.nodes[id];
      if(!node){ box.innerHTML = `<div class="help">Invalid node.</div>`; return; }

      const crumbs=h('div',{class:'crumbs'});
      ACTIVE.path.forEach((pid,i)=>{ const label=(pid==='root')?'Start':(T.nodes[pid]?.title||pid); crumbs.appendChild(h('div',{class:'crumb',text:(i===0?'Start: ':'')+label})); });
      const body=h('div');

      if(node.type==='q'){
        $('#p1').classList.remove('active'); $('#p2').classList.add('active');
        body.appendChild(h('h3',{text:node.title}));
        if(node.text) body.appendChild(h('p',{class:'help',text:node.text}));
        node.options.forEach(opt=>{
          body.appendChild(h('div',{class:'opt',onclick:()=>{ ACTIVE.path.push(opt.next); render(opt.next); }},[
            h('div',{text:opt.label}), h('span',{class:'help',text:'→'})
          ]));
        });
      }
      else if(node.type==='ask'){
        $('#p1').classList.remove('active'); $('#p2').classList.add('active');
        const unit=node.unit||''; const sp = node.specFrom ? specFromGlobal(node.specFrom) : null;
        body.appendChild(h('h3',{text:node.title})); if(node.text) body.appendChild(h('p',{class:'help',text:node.text}));
        const row=h('div',{class:'ask'});
        const inp=h('input',{class:'input v13',placeholder:unit||'Value',style:'max-width:160px'});
        let p=pill(sp?null:null); const bar= sp? miniBar(sp,null): null;
        row.appendChild(inp); if(unit) row.appendChild(h('span',{class:'help',text:unit})); if(bar) row.appendChild(bar); row.appendChild(p);
        const next=h('button',{class:'btn',onclick:()=>{
          const v=inp.value.trim(); ACTIVE.measures[id]=v; const n=Number(v);
          const r=node.routes?.find(r=>{ if(r.when==='<' )return isFinite(n)&&n< r.value; if(r.when==='<=')return isFinite(n)&&n<=r.value; if(r.when==='>')return isFinite(n)&&n> r.value; if(r.when==='>=')return isFinite(n)&&n>=r.value; if(r.when==='==')return String(v)===String(r.value); return false; }) || node.routes?.slice(-1)[0];
          if(r && r.next){ ACTIVE.path.push(r.next); render(r.next); }
        }},'Continue');
        inp.addEventListener('input',()=>{ const st=sp?withinSpec(inp.value,sp):null; const np=pill(st); p.replaceWith(np); p=np; if(bar&&bar._place) bar._place(inp.value); });
        body.appendChild(row); body.appendChild(h('div',{class:'inline',style:'justify-content:flex-end;margin-top:8px'},[next]));
      }
      else if(node.type==='leaf'){
        $('#p2').classList.remove('active'); $('#p3').classList.add('active');
        body.appendChild(h('h3',{text:node.title}));
        body.appendChild(h('p',{class:'help',text:'Tick only what you checked. Inputs with SPEC show live status.'}));

        const tabs=h('div',{class:'tabs',id:'tabs'});
        const content=h('div',{id:'leafContent',style:'margin-top:8px'});
        body.appendChild(tabs); body.appendChild(content);

        const subs=(node.subs||[]).filter(n=>getSub(n));
        if(!subs.length){
          content.appendChild(h('div',{class:'panel'},[h('div',{class:'help',text:'No data is available yet for this leaf.'})]));
        }else{
          subs.forEach((name,i)=>{ tabs.appendChild(chip(name,i===0,()=>show(name))); content.appendChild(subPanel(name,getSub(name))); });
          show(subs[0]);
        }
        body.appendChild(h('div',{class:'inline',style:'gap:8px;justify-content:flex-end;margin-top:10px'},[
          h('button',{class:'btn',onclick:()=>diagnose(subs)},'Run Diagnosis'),
          h('button',{class:'btn ghost',onclick:()=>init()},'Start over')
        ]));

        function chip(label,active,onClick){
          const el=h('div',{class:'chip'+(active?' active':''),onclick:()=>{ $$('#tabs .chip',body).forEach(c=>c.classList.remove('active')); el.classList.add('active'); onClick(); }},label);
          return el;
        }
        function show(name){ $$('#leafContent .panel',body).forEach(p=>p.style.display='none'); const el=$(`#leafContent .panel[data-name="${CSS.escape(name)}"]`,body); if(el) el.style.display='block'; }
      }

      box.innerHTML=''; box.appendChild(crumbs); box.appendChild(body);
    }

    function subPanel(name, node){
      const wrap=h('div',{class:'panel','data-name':name}); wrap.appendChild(h('h3',{text:name}));
      const rows = Array.isArray(node?.checks)?node.checks:(Array.isArray(node)?node:[]);
      const labels = rows.map(r=>r?.label||r?.check||'');
      const allIPU = labels.length && labels.every(s=>/^IPU\s+\d+$/i.test(s));
      const allEX  = labels.length && labels.every(s=>/^Extrusion\s+\d+$/i.test(s));

      if(allIPU || allEX){
        const grid=h('div',{class:'grid compact'});
        labels.forEach((lab,i)=>{
          const specTok=rows[i]?.spec?.[0]; const spec=parseSpec(specTok);
          const card=h('div',{class:'panel',style:'padding:10px'});
          card.appendChild(h('div',{class:'title',text:lab}));
          const line=h('div',{class:'inline',style:'gap:6px;align-items:center;margin-top:6px;flex-wrap:wrap'});
          const cb=h('input',{type:'checkbox'}), input=h('input',{class:'input v13',placeholder:'Value',style:'max-width:120px',disabled:true});
          const bar=spec?miniBar(spec,null):null; let p=pill(spec?null:null);
          cb.addEventListener('change',()=>{ input.disabled=!cb.checked; });
          input.addEventListener('input',()=>{ const st=spec?withinSpec(input.value,spec):null; const np=pill(st); p.replaceWith(np); p=np; if(bar&&bar._place) bar._place(input.value); });
          line.appendChild(cb); line.appendChild(input); if(bar) line.appendChild(bar); line.appendChild(p); card.appendChild(line); grid.appendChild(card);
        });
        wrap.appendChild(grid); return wrap;
      }

      const box=h('div',{class:'grid cols-1',style:'gap:8px;margin-top:6px'});
      rows.forEach((row,idx)=>{
        const label=(row&&typeof row==='object')?(row.label||row.check||`Check ${idx+1}`):String(row||`Check ${idx+1}`);
        const unit=row?.unit?String(row.unit):''; const specTok=row?.spec?.[0]; const spec=parseSpec(specTok);
        const line=h('div',{class:'inline',style:'gap:8px;align-items:center;flex-wrap:wrap'});
        const cb=h('input',{type:'checkbox'}), input=h('input',{class:'input v13',placeholder:(unit||'Value'),style:'max-width:160px',disabled:true});
        const bar=spec?miniBar(spec,null):null; let p=pill(spec?null:null);
        line.appendChild(cb); line.appendChild(h('span',{text:label}));
        const iw=h('div',{class:'inline',style:'gap:6px;align-items:center;flex-wrap:wrap'});
        iw.appendChild(input); if(unit) iw.appendChild(h('span',{class:'help',text:unit})); if(bar) iw.appendChild(bar); iw.appendChild(p);
        cb.addEventListener('change',()=>{ input.disabled=!cb.checked; });
        input.addEventListener('input',()=>{ const st=spec?withinSpec(input.value,spec):null; const np=pill(st); p.replaceWith(np); p=np; if(bar&&bar._place) bar._place(input.value); });
        line.appendChild(iw); box.appendChild(line);
      });
      wrap.appendChild(box); return wrap;
    }

    function collect(subs){
      const res={subs:{}, totals:{enabled:0,filled:0,out:0,warn:0}};
      subs.forEach(name=>{
        const pane=$(`#box [data-name="${CSS.escape(name)}"]`); if(!pane) return;
        const items=[];
        $$('div.inline',pane).forEach(row=>{
          const cb=$('input[type="checkbox"]',row), en=!!(cb&&cb.checked);
          const label=row.parentElement.querySelector('.title')?.textContent || row.parentElement.querySelector('span')?.textContent || '';
          const inp=$('input.input.v13',row); const val=inp?inp.value.trim():'';
          const stEl=$('.pill',row); let st='n/a';
          if(stEl){ if(stEl.classList.contains('bad')) st='out'; else if(stEl.classList.contains('warn')) st='warn'; else if(stEl.classList.contains('ok')) st='ok'; }
          items.push({label,enabled:en,value:val,status:st});
        });
        res.subs[name]=items;
      });
      Object.values(res.subs).forEach(items=>{
        items.forEach(x=>{ if(x.enabled) res.totals.enabled++; if(x.enabled&&x.value) res.totals.filled++; if(x.enabled&&x.value&&x.status==='out') res.totals.out++; if(x.enabled&&x.value&&x.status==='warn') res.totals.warn++; });
      });
      return res;
    }

    function analyze(data){
      const summary=[]; const bySub={};
      Object.entries(data.subs).forEach(([name,items])=>{
        const en=items.filter(x=>x.enabled).length, filled=items.filter(x=>x.enabled&&x.value).length;
        const out=items.filter(x=>x.enabled&&x.value&&x.status==='out').length;
        const warn=items.filter(x=>x.enabled&&x.value&&x.status==='warn').length;
        bySub[name]={en,filled,out,warn}; if(en) summary.push(`${name}: ${out}/${filled} out, ${warn} borderline`);
      });
      const rec=[]; const worst=Object.entries(bySub).sort((a,b)=>(b[1].out-b[1].out)||(b[1].warn-b[1].warn))[0];
      if(worst){
        const k=worst[0].toLowerCase();
        if(k.includes('ird x')) rec.push('Balance IRD X extrusions to target; verify heat profile & transport speed.');
        if(k.includes('ird'))   rec.push('Verify IRD current calibration and IPU balance; check exhaust flow.');
        if(k.includes('sts'))   rec.push('Check STS fans & temp sensors; run re-calibration.');
        if(k.includes('powder'))rec.push('Verify powder rate & pump pressure; clean nozzles.');
        if(k.includes('ics')||k.includes('bcs')) rec.push('Check coating viscosity/profile and lamp performance.');
        if(k.includes('jetting')) rec.push('Purge/clean heads; verify filtration & nozzle health.');
        if(k.includes('transport')||k.includes('tension')||k.includes('encoders')) rec.push('Verify web tension, encoder sync and rollers; look for periodic marks.');
      }
      if(data.totals.out===0 && data.totals.filled>0) rec.push('All entered values within spec. Review media/settings; consider raising throughput.');
      return {summary, totals:data.totals, recommendations:rec};
    }

    function modalDiagnosis(rep){
      let back=$('#modalBack'), mod=$('#modal');
      if(!back||!mod){ back=h('div',{class:'modal-back',id:'modalBack'}); mod=h('div',{class:'modal',id:'modal'}); back.appendChild(mod); document.body.appendChild(back); }
      mod.innerHTML=''; mod.appendChild(h('div',{class:'title',text:'Diagnosis'}));
      const body=h('div',{style:'margin-top:12px'}); mod.appendChild(body);
      body.appendChild(h('div',{class:'panel'},[
        h('div',{class:'kv'},[h('span',{class:'k',text:'Summary:'}),h('span',{class:'v',text:rep.summary.join(' | ')||'No checks enabled'})]),
        h('div',{class:'kv'},[h('span',{class:'k',text:'Totals:'}),h('span',{class:'v',text:`Enabled ${rep.totals.enabled}, Filled ${rep.totals.filled}, Out ${rep.totals.out}, Borderline ${rep.totals.warn}`})])
      ]));
      body.appendChild(h('div',{class:'panel',style:'margin-top:10px'},[
        h('h3',{text:'Recommendations'}),
        rep.recommendations.length ? h('ul',{},rep.recommendations.map(r=>h('li',{text:r}))) : h('div',{class:'help',text:'No specific recommendations.'})
      ]));
      body.appendChild(h('div',{class:'inline',style:'gap:8px;justify-content:flex-end;margin-top:10px'},[
        h('button',{class:'btn primary',onclick:saveAsCase},'Save as Case'),
        h('button',{class:'btn small danger',onclick:()=>{ back.style.display='none'; }},'Close')
      ]));
      back.style.display='flex';

      function saveAsCase(){
        try{
          if(typeof go==='function') go('create');
          setTimeout(()=>{
            const issue=$('#issueSummary'), sym=$('#symptoms'), sol=$('#solution');
            if(issue) issue.value='RCA – '+(rep.summary.join(' | ')|| (ACTIVE.issue||'').toUpperCase());
            if(sym)   sym.value=(rep.recommendations||[]).map(x=>'• '+x).join('\n');
            if(sol)   sol.value='Apply top recommendations, re-measure, and re-run RCA.';
            if(typeof toast==='function') toast('Diagnosis copied to new case','ok');
          },80);
        }catch(e){}
        const mb=$('#modalBack'); if(mb) mb.style.display='none';
      }
    }

    function diagnose(subs){
      const data=collect(subs||[]); const rep=analyze(data); modalDiagnosis(rep); $('#p4').classList.add('active');
    }

    // Hook into router
    window.initFishbone = function(){
      const page=document.getElementById('page-diagnosis'); if(!page) return;
      page.innerHTML = '<div id="fbHost"></div>'; build($('#fbHost')); 
    };
    const _go=window.go;
    if(typeof _go==='function'){
      window.go=function(route){ const r=_go.apply(this,arguments); if(route==='diagnosis') setTimeout(window.initFishbone,0); if(route!=='diagnosis'){ const mb=$('#modalBack'); if(mb) mb.style.display='none'; } return r; };
    }
    document.addEventListener('DOMContentLoaded',()=>{ const pg=document.getElementById('page-diagnosis'); if(pg && !pg.classList.contains('hidden')) window.initFishbone(); });

  } // build end

})();
