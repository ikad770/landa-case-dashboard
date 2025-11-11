// /js/wizard.js — HOTFIX: robust init + no dependency on old fishbone.js

(function(){
  if (window.__LANDA_WIZARD__) return; window.__LANDA_WIZARD__=true;

  const $=(s,r=document)=>r.querySelector(s);

  // ---- tiny builder for RCA selector only (to verify it's loading) ----
  function mountSelector(host){
    host.innerHTML = `
      <div class="panel">
        <h2 style="margin:0 0 6px">Root Cause Analyzer – Pro Wizard</h2>
        <p class="help">Select an issue to start the interactive flow.</p>
        <div class="issue-grid" id="rca-issues">
          <div class="issue-card" data-i="setoff"><div class="title">SetOff</div><div class="sub">Drying / Coating</div></div>
          <div class="issue-card" data-i="scratches"><div class="title">Scratches</div><div class="sub">Surface / Transport</div></div>
          <div class="issue-card" data-i="uniformity"><div class="title">Uniformity</div><div class="sub">Bands / Streaks</div></div>
          <div class="issue-card" data-i="pq"><div class="title">PQ</div><div class="sub">Print Quality</div></div>
        </div>
      </div>
      <div class="panel" id="rca-stage" style="margin-top:10px; display:none"></div>
    `;

    // simple first stage to prove flow works
    const cards = host.querySelectorAll('#rca-issues .issue-card');
    cards.forEach(c=>{
      c.addEventListener('click', ()=>{
        const code = c.dataset.i;
        const stage = $('#rca-stage', host);
        stage.style.display = 'block';
        stage.innerHTML = `
          <h3 style="margin:0 0 8px">${(window.RCA_DATA?.[code]?.title||code).toUpperCase()}</h3>
          <p class="help">This is the new wizard container. The full fishbone path will render here.</p>
          <div class="inline" style="gap:8px;flex-wrap:wrap">
            <button class="btn" id="rca-demo-next">Continue</button>
            <button class="btn ghost" id="rca-demo-reset">Back</button>
          </div>
        `;
        stage.querySelector('#rca-demo-reset').onclick = ()=> mountSelector(host);
        stage.querySelector('#rca-demo-next').onclick  = ()=> {
          stage.innerHTML = `
            <div class="panel">
              <h3 style="margin:0 0 8px">Checks</h3>
              <label class="inline" style="gap:8px;align-items:center">
                <input type="checkbox" id="chk1">
                <span>Example check with SPEC (60–90)</span>
                <input class="input v13" style="max-width:120px" placeholder="Value">
              </label>
            </div>
          `;
        };
      });
    });
  }

  // ---- init when route is diagnosis ----
  function initFishbone(){
    const page = document.getElementById('page-diagnosis'); if(!page) return;
    // create a stable host
    if (!document.getElementById('fbHost')) {
      const host = document.createElement('div'); host.id = 'fbHost';
      page.innerHTML = ''; page.appendChild(host);
      mountSelector(host);
    }
  }
  window.initFishbone = initFishbone;

  // hook router if exists
  const prevGo = window.go;
  if (typeof prevGo === 'function') {
    window.go = function(route){
      const r = prevGo.apply(this, arguments);
      if (route === 'diagnosis') setTimeout(initFishbone, 0);
      return r;
    };
  }

  // also init if page visible on load
  document.addEventListener('DOMContentLoaded', ()=>{
    const pg = document.getElementById('page-diagnosis');
    if (pg && !pg.classList.contains('hidden')) initFishbone();
  });
})();
