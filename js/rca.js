// js/rca.js
// Root Cause Analyzer – Dynamic Wizard Launcher (V2.0)

(function() {
  if (window.__LANDA_RCA__) return; window.__LANDA_RCA__ = true;

  const ENUMS = window.LANDA_ENUMS || {};
  const RCA_DATA = window.RCA_DATA || {};
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // מצב פעיל: חשיפה גלובלית ל-fishbone.js
  const ACTIVE = { issue: 'setoff', branch: null, currentStep: 0, answers: {} }; 
  window.__RCA_ACTIVE_STATE__ = ACTIVE; 

  // פונקציה להזרקת ה-Launcher ל-Diagnosis Page
  function injectLauncher() {
    const diagPage = document.getElementById("page-diagnosis");
    if (!diagPage) return;

    // מנקה תוכן קיים (ממודאל קודם)
    diagPage.innerHTML = '';
    
    // מכין את ה-host של ה-Fishbone
    const fbHost = document.createElement("div");
    fbHost.id = "fbHost";
    diagPage.appendChild(fbHost);

    // בניית האפשרויות לבחירת סוג הבעיה
    const optionsHtml = ENUMS.ISSUE_CODES.map(issue => `
      <div class="rca-issue-card" data-issue="${issue.id}">
        <div class="title" style="color:var(--accent)">${issue.name} (${issue.id})</div>
        <div class="help">${issue.desc}</div>
        <button class="btn primary small" type="button" data-issue="${issue.id}">Start Wizard</button>
      </div>
    `).join('');

    const panel = document.createElement("div");
    panel.className = "panel rca-launch-panel";
    panel.id = "rcaLaunchPanel";
    panel.innerHTML = `
      <h2 style="margin-top:0">RCA Wizard Launcher</h2>
      <p class="help">Select the main Issue Code to begin the guided Root Cause Analysis flow.</p>
      <div style="display:flex; gap:15px; flex-wrap:wrap; margin-top:15px">
        ${optionsHtml}
      </div>
    `;
    diagPage.prepend(panel);

    // לוגיקת הפעלת ה-Wizard
    qsa(".rca-issue-card button", diagPage).forEach(btn => {
      btn.addEventListener("click", () => {
        const issueId = btn.dataset.issue.toLowerCase();
        const issueData = RCA_DATA[issueId];
        
        if (issueData) {
          // איפוס המצב לפני ההתחלה
          ACTIVE.issue = issueId;
          ACTIVE.branch = null; 
          ACTIVE.currentStep = 0;
          ACTIVE.answers = {};

          // קורא לפונקציית הבנייה של Fishbone עם קוד הבעיה הנבחר
          if (typeof window.initFishbone === 'function') {
             window.initFishbone(issueId); 
          } else {
             window.toast("Fishbone library not loaded.", 'err');
             return;
          }
          
          // הסתרת הפאנל והצגת הוויזארד
          qs("#rcaLaunchPanel", diagPage).classList.add('hidden'); 

        } else {
          window.toast(`RCA data for ${issueId.toUpperCase()} not implemented yet.`, 'warn');
        }
      });
    });
  }

  // חשיפה גלובלית לפונקציה כדי ש-app.js יוכל לקרוא לה ב-go('diagnosis')
  window.injectRcaLauncher = injectLauncher;

})();
