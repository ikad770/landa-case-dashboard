// js/cases.js - קוד מלא ומעודכן
// רנדור רשימת הקייסים והמודאל

(function(){
  if (window.__LANDA_CASES__) return; window.__LANDA_CASES__=true;
  
  const LS_KEY='landa_cases_v14'; // המפתח המעודכן
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const ENUMS = window.LANDA_ENUMS || {};

  function getCases(){ try{ return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); }catch(e){ return [] } }
  function esc(s){ return (s||'').replace(/[&<>\"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c])) }
  function nl(s){ return String(s||'').replace(/\n/g,'<br>') }

  // פונקציית עזר להצגת תג הקושי
  function getDifficultyBadge(diffId){
    const diff = ENUMS.DIFFICULTY_LEVELS.find(d => d.id === diffId);
    if (!diff) return `<span class="difficulty-badge">N/A</span>`;
    const className = `diff-${diff.id.toLowerCase()}`;
    return `<span class="difficulty-badge ${className}">${diff.name}</span>`;
  }

  function render(){
    const root = document.getElementById('page-cases'); if(!root) return;
    
    // יצירת מבנה ה-Cases Page אם הוא לא קיים
    root.innerHTML = `
      <div class="panel" id="casesPro">
        <div class="inline" style="gap:8px;justify-content:space-between;flex-wrap:wrap">
          <h2 style="margin:0">All Cases - <span id="casesCount">0</span></h2>
          <div class="inline" style="gap:8px;flex-wrap:wrap">
            <input id="q" class="input v13" placeholder="Search (System, Code, Summary)…" style="min-width:240px">
            <button class="btn" id="apply">Apply</button>
          </div>
        </div>
        <div id="cards" style="margin-top:10px"></div>
      </div>
    `;

    const cards = document.getElementById('cards');
    
    function paint(){
      const q = ($('#q').value||'').toLowerCase();
      const allCases = getCases();

      const arr = allCases.filter(c=>{
        // חיפוש חכם יותר המשלב את השדות החדשים
        const searchableText=((c.issueSummary||'')+' '+(c.model||'')+' '+(c.system||'')+' '+(c.subSystem||'')+' '+(c.issueCode||'')+' '+(c.solutionDifficulty||'')).toLowerCase();
        return !q || searchableText.includes(q);
      });
      
      cards.innerHTML = arr.length ? arr.map((c,i)=> {
          // מציאת השם המלא של קוד התקלה
          const issueName = ENUMS.ISSUE_CODES.find(ic => ic.id === c.issueCode)?.name || c.issueCode;
          
          return `
            <div class="case-card">
              <div class="stripe" style="background:${c.solutionDifficulty === 'HARD' ? 'var(--err)' : c.solutionDifficulty === 'MEDIUM' ? 'var(--warn)' : 'var(--ok)'}"></div>
              <div>
                <div class="title">#${allCases.length - i} — ${esc(c.sfCase||'')}</div>
                <div class="meta">
                  <span style="color:var(--accent); font-weight:600">${esc(c.system||'')} / ${esc(c.subSystem||'')}</span> · Issue: ${esc(issueName)}
                </div>
                <div class="kv" style="margin-top:6px">
                    <span class="k">Summary:</span><span class="v">${esc(c.issueSummary||'')}</span>
                </div>
              </div>
              <div class="actions">
                ${getDifficultyBadge(c.solutionDifficulty)}
                <button class="btn small" onclick="openCase(${allCases.indexOf(c)})">Details</button>
              </div>
            </div>
          `;
      }).join('') : '<div class="help">No cases match your search.</div>';

      const badge=document.getElementById('casesCount'); 
      if(badge) badge.textContent=String(allCases.length);
    }
    
    // פונקציית פתיחת המודאל (Details)
    window.openCase = function(index){
      const c = getCases()[index]; if(!c) return;
      const modal = document.createElement('div');
      modal.id = 'modalBack';
      
      const issueName = ENUMS.ISSUE_CODES.find(ic => ic.id === c.issueCode)?.name || c.issueCode;
      
      modal.innerHTML = `
        <div id="modalContent" class="modal-content">
          <div class="modal-header">
            <h3>Case Details: ${esc(c.sfCase||'')}</h3>
            <span class="meta">Created: ${new Date(c.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="modal-body" style="padding:15px 20px">
            
            <div class="fields-wrap">
              <div class="half">
                <span class="label">System / Subsystem:</span>
                <div class="title">${esc(c.system||'')} / ${esc(c.subSystem||'')}</div>
              </div>
              <div class="half">
                <span class="label">Issue Code / Difficulty:</span>
                <div class="title">${esc(issueName)} / ${getDifficultyBadge(c.solutionDifficulty)}</div>
              </div>
            </div>
            
            <div class="kv full" style="margin-top:10px">
              <span class="k">Issue Summary:</span><span class="v">${esc(c.issueSummary||'')}</span>
            </div>
            
            <div class="kv full" style="margin-top:10px">
              <span class="k">Root Cause:</span><span class="v">${nl(esc(c.rootCause||''))}</span>
            </div>
            
            <div class="kv full" style="margin-top:10px">
              <span class="k">Detailed Solution:</span><span class="v">${nl(esc(c.solution||''))}</span>
            </div>
            
            <div class="kv full" style="margin-top:10px">
              <span class="k">Verification:</span><span class="v">${esc(c.verification||'')}</span>
            </div>
            
            ${c.attachments.length ? `
              <div class="full" style="margin-top:10px">
                <span class="label">Attachments:</span>
                ${c.attachments.map(a => `<a href="${a}" target="_blank" style="display:block;color:var(--accent);font-size:13px">${a}</a>`).join('')}
              </div>
            ` : ''}
            
            <div class="kv full" style="margin-top:10px">
              <span class="k">Notes:</span><span class="v">${nl(esc(c.notes||''))}</span>
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn primary small" onclick="document.getElementById('modalBack').remove()">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      // סטיילינג למודאל
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.8); z-index: 1000;
        display: flex; justify-content: center; align-items: center;
      `;
      $$('.modal-content', modal).forEach(el => el.style.cssText = `
        background: var(--bg2); border-radius: var(--radius);
        max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
      `);
      $$('.modal-header', modal).forEach(el => el.style.cssText = `
        padding: 15px 20px; border-bottom: 1px solid var(--border);
        display: flex; justify-content: space-between; align-items: center;
        background: var(--bg);
      `);
      $$('.modal-footer', modal).forEach(el => el.style.cssText = `
        padding: 10px 20px; border-top: 1px solid var(--border);
        text-align: right;
      `);
    };

    $('#q').oninput = paint; // חיפוש בזמן הקלדה
    $('#apply').onclick = paint; // או לחיצה על כפתור Apply

    paint();
  }

  // חשיפה גלובלית לפונקציה כדי ש-app.js יוכל לקרוא לה ב-go('cases')
  window.renderCases = render; 

  // Router hook כבר לא נדרש כאן כי app.js מטפל בזה דרך window.renderCases
})();
