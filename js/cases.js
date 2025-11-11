// /js/cases.js
// Modern Cases board with cards, quick filters, and detail modal. Uses the same LS key.

(function(){
  if (window.__LANDA_CASES__) return; window.__LANDA_CASES__=true;
  const LS_KEY='landa_cases_v13';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  function getCases(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); }catch(e){ return [] } }

  // Scoped styles (no global override)
  const css = `
  #casesPro .toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between}
  #casesPro .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:12px}
  #casesPro .card{border:1px solid var(--border);border-radius:14px;padding:12px;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));box-shadow:0 14px 34px rgba(0,0,0,.32);transition:.2s}
  #casesPro .card:hover{transform:translateY(-1px);border-color:rgba(59,208,255,.45);box-shadow:0 20px 48px rgba(0,174,239,.26)}
  #casesPro .kv{display:flex;gap:6px}
  #casesPro .tag{padding:2px 8px;border:1px solid var(--border);border-radius:999px;font-size:12px}
  #casesPro .tag.ok{border-color:rgba(74,222,128,.55)} #casesPro .tag.warn{border-color:rgba(255,196,0,.6)} #casesPro .tag.bad{border-color:rgba(255,73,103,.6)}
  `;
  const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  function statusOf(c){
    // Heuristic: if solution filled => Fixed; else if troubleshooting or symptoms exist => In progress; else => New
    const sol=(c.solution||'').trim(), tr=(c.troubleshooting||'').trim(), sy=(c.symptoms||'').trim();
    if(sol) return {code:'fixed', label:'Fixed', cls:'ok'};
    if(tr || sy) return {code:'progress', label:'In Progress', cls:'warn'};
    return {code:'new', label:'New', cls:''};
  }

  function render(){
    const root=$('#page-cases'); if(!root) return;
    root.innerHTML='';
    const panel=document.createElement('div'); panel.className='panel'; panel.id='casesPro';
    const qWrap=document.createElement('div'); qWrap.className='toolbar';
    qWrap.innerHTML = `
      <div class="inline" style="gap:8px;flex-wrap:wrap">
        <input id="q" class="input v13" placeholder="Search (Issue / Model / System)" style="min-width:240px">
        <select id="flt" class="input v13" style="max-width:160px">
          <option value="">All statuses</option>
          <option value="fixed">Fixed</option>
          <option value="progress">In Progress</option>
          <option value="new">New</option>
        </select>
        <button class="btn" id="apply">Apply</button>
      </div>
      <div class="inline" style="gap:8px;flex-wrap:wrap">
        <button class="btn" id="toCSV">Export CSV</button>
      </div>
    `;
    panel.appendChild(qWrap);

    const holder=document.createElement('div'); holder.className='cards'; panel.appendChild(holder);
    root.appendChild(panel);

    function paint(){
      const arr=getCases();
      const q=($('#q').value||'').toLowerCase();
      const flt=$('#flt').value;
      const filtered = arr.filter(c=>{
        const s = (c.issueSummary||'')+' '+(c.model||'')+' '+(c.system||'')+' '+(c.item||'');
        const okQ = !q || s.toLowerCase().includes(q);
        const st=statusOf(c);
        const okF = !flt || st.code===flt;
        return okQ && okF;
      });

      holder.innerHTML = filtered.length ? filtered.map((c,i)=>card(c,i)).join('') : `<div class="help">No cases.</div>`;
      const badge=document.getElementById('casesCount'); if(badge) badge.textContent=String(arr.length);
    }

    function esc(s){ return (s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])) }
    function card(c,i){
      const st=statusOf(c);
      const files = Array.isArray(c.attachments)&&c.attachments.length ? `${c.attachments.length} file(s)` : 'No attachments';
      return `
      <div class="card">
        <div class="inline" style="justify-content:space-between;align-items:center">
          <div class="title">#${i+1} — ${esc(c.sfCase||'')}</div>
          <div class="tag ${st.cls}">${st.label}</div>
        </div>
        <div class="kv" style="margin-top:6px"><span class="k">Issue:</span><span class="v">${esc(c.issueSummary||'')}</span></div>
        <div class="meta" style="color:var(--muted);font-size:12.5px;margin-top:4px">
          Model: ${esc(c.model||'')} (${esc(c.machineType||'')}) · System: ${esc(c.system||'')} / ${esc(c.subSystem||'')}
        </div>
        <div class="kv" style="margin-top:6px"><span class="k">Files:</span><span class="v">${files}</span></div>
        <div class="inline" style="gap:8px;justify-content:flex-end;margin-top:10px">
          <button class="btn small" onclick="__openCase(${i})">Details</button>
          <button class="btn small danger" onclick="__deleteCase(${i})">Delete</button>
        </div>
      </div>`;
    }

    $('#apply').onclick=paint;
    $('#toCSV').onclick=exportCSV;
    paint();

    window.__openCase = function(i){
      const arr=getCases(); const c=arr[i]; if(!c) return;
      let back=$('#modalBack'), mod=$('#modal');
      if(!back||!mod){ back=document.createElement('div'); back.className='modal-back'; back.id='modalBack';
        mod=document.createElement('div'); mod.className='modal'; mod.id='modal'; back.appendChild(mod); document.body.appendChild(back); }
      mod.innerHTML='';
      const header=document.createElement('div'); header.style.display='flex'; header.style.justifyContent='space-between'; header.style.alignItems='center';
      header.innerHTML=`<div class="title">Case #${i+1} — ${esc(c.sfCase||'')}</div>`;
      const close=document.createElement('button'); close.className='btn small danger'; close.textContent='Close'; close.onclick=()=>back.style.display='none';
      header.appendChild(close); mod.appendChild(header);

      const b=document.createElement('div'); b.style.marginTop='12px'; mod.appendChild(b);
      b.innerHTML = `
        <div class="grid cols-2">
          <div class="panel">
            <div class="kv"><span class="k">Model:</span><span class="v">${esc(c.model||'')} (${esc(c.machineType||'')})</span></div>
            <div class="kv"><span class="k">System:</span><span class="v">${esc(c.system||'')} / ${esc(c.subSystem||'')}</span></div>
            <div class="kv"><span class="k">Category:</span><span class="v">${esc(c.category||'')} → ${esc(c.item||'')}</span></div>
            <div class="kv"><span class="k">Software:</span><span class="v">${esc(c.softwareVersion||'')}</span></div>
            <div class="kv"><span class="k">TFS:</span><span class="v">${esc(c.tfsNumber||'')}</span></div>
          </div>
          <div class="panel">
            <div class="kv"><span class="k">Opened:</span><span class="v">${new Date(c.createdAt).toLocaleString()}</span></div>
            <div class="kv"><span class="k">Author:</span><span class="v">${esc(c.author||'')}</span></div>
          </div>
        </div>
        <div class="panel" style="margin-top:12px"><h3>Problem</h3>
          <div class="kv"><span class="k">Summary:</span><span class="v">${esc(c.issueSummary||'')}</span></div>
          <div class="kv"><span class="k">Symptoms:</span><span class="v">${(c.symptoms||'').replace(/\n/g,'<br>')}</span></div>
        </div>
        <div class="panel" style="margin-top:12px"><h3>Solution</h3>
          <div class="kv"><span class="k">Troubleshooting:</span><span class="v">${(c.troubleshooting||'').replace(/\n/g,'<br>')}</span></div>
          <div class="kv"><span class="k">Part (catalog):</span><span class="v">${esc(c.partCatalog||'')}</span></div>
          <div class="kv"><span class="k">Implemented:</span><span class="v">${(c.solution||'').replace(/\n/g,'<br>')}</span></div>
          <div class="kv"><span class="k">Verification:</span><span class="v">${esc(c.verification||'')}</span></div>
          <div class="kv"><span class="k">Notes:</span><span class="v">${(c.notes||'').replace(/\n/g,'<br>')}</span></div>
          <div class="kv" style="margin-top:12px"><span class="k">Files:</span><span class="v">${
            (Array.isArray(c.attachments)&&c.attachments.length)
              ? c.attachments.map(a=>`<a class="btn small" href="${a.data}" target="_blank">View</a><a class="btn small" href="${a.data}" download="${a.name}">Download</a> <span class="v">${esc(a.name)}</span>`).join('<br>')
              : 'No attachments'
          }</span></div>
        </div>
      `;
      back.style.display='flex';
    };

    window.__deleteCase = function(i){
      const arr=getCases(); if(!arr[i]) return; if(!confirm('Delete this case?')) return;
      arr.splice(i,1); localStorage.setItem(LS_KEY, JSON.stringify(arr));
      if(typeof toast==='function') toast('Case deleted','ok');
      render();
    };

    function exportCSV(){
      const arr=getCases();
      const cols=['sfCase','tfsNumber','machineType','model','system','subSystem','category','item','softwareVersion','issueSummary','symptoms','troubleshooting','partCatalog','solution','verification','notes','attachments','createdAt','author'];
      const csv=[cols.join(',')].concat(arr.map(o=> cols.map(k=> JSON.stringify((Array.isArray(o[k])? o[k].length+' file(s)' : (o[k]||'')).toString().replace(/\n/g,' '))).join(','))).join('\n');
      const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='landa_cases.csv'; a.click();
    }
  }

  // Hook routing
  const _go=window.go;
  if(typeof _go==='function'){
    window.go=function(route){ const r=_go.apply(this,arguments); if(route==='cases'){ setTimeout(()=>{ const root=document.getElementById('page-cases'); if(root && !root.dataset.__painted){ root.dataset.__painted='1'; } },0); setTimeout(()=>{ (function(){ const root=document.getElementById('page-cases'); if(!root) return; // paint now
      (function paint(){ // render immediately
        const scriptTag = document.createElement('script'); // trick to run render() closure again
        scriptTag.type='text/plain'; root.appendChild(scriptTag); // no-op
      })();
    })(); },10); } return r; };
  }
  document.addEventListener('DOMContentLoaded',()=>{ /* lazy render when visiting page */ });

})();
