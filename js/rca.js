// rca.js
// Root Cause Analyzer – Next-Level Wizard (V20)
// Uses window.RCA_DATA (from rca-data.js) and injects UI into #page-diagnosis

(function () {
  const DATA = window.RCA_DATA || {};
  if (!DATA || !document.getElementById("page-diagnosis")) return;

  /* ---------- Inject scoped CSS for the wizard ---------- */
  (function injectCSS() {
    const css = `
    .rca-shell{
      border-radius:16px;
      padding:18px;
      display:flex;
      flex-direction:column;
      gap:14px;
      background:linear-gradient(180deg, rgba(12,16,26,.9), rgba(6,10,18,.88));
      box-shadow:0 22px 60px rgba(0,0,0,.65), inset 0 0 0 1px rgba(255,255,255,.04);
    }
    .rca-header{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:16px;
      flex-wrap:wrap;
    }
    .rca-issues{
      display:flex;
      gap:8px;
      flex-wrap:wrap;
    }
    .rca-issue-pill{
      padding:6px 12px;
      border-radius:999px;
      border:1px solid var(--border);
      cursor:pointer;
      font-size:13px;
      background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01));
      display:flex;
      align-items:center;
      gap:6px;
      opacity:.86;
      transition:.2s;
    }
    .rca-issue-pill span.badge{
      font-size:11px;
      padding:1px 7px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,.1);
      color:var(--muted);
    }
    .rca-issue-pill.active{
      border-color:var(--accent);
      background:linear-gradient(180deg, rgba(0,174,239,.28), rgba(0,174,239,.08));
      opacity:1;
      box-shadow:0 14px 30px rgba(0,174,239,.32);
    }
    .rca-progress{
      flex:1;
      min-width:160px;
    }
    .rca-progress-bar{
      height:6px;
      border-radius:999px;
      background:rgba(255,255,255,.04);
      overflow:hidden;
      position:relative;
    }
    .rca-progress-bar > div{
      height:100%;
      border-radius:999px;
      background:linear-gradient(90deg,var(--accent),var(--accent2));
      width:0%;
      transition:width .25s ease-out;
      box-shadow:0 0 16px rgba(0,174,239,.55);
    }
    .rca-progress-label{
      display:flex;
      justify-content:space-between;
      margin-top:4px;
      font-size:11.5px;
      color:var(--muted);
    }
    .rca-stage{
      position:relative;
      min-height:220px;
      overflow:hidden;
    }
    .rca-card{
      border-radius:16px;
      border:1px solid var(--border);
      padding:16px;
      background:radial-gradient(circle at 0% 0%,rgba(0,174,239,.12),transparent 60%),
                 radial-gradient(circle at 100% 100%,rgba(59,208,255,.09),transparent 55%),
                 linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.015));
      box-shadow:0 18px 46px rgba(0,0,0,.52), inset 0 0 0 1px rgba(255,255,255,.02);
      animation:rcaSlideIn .24s ease-out;
    }
    @keyframes rcaSlideIn{
      from{opacity:0; transform:translateX(14px);}
      to{opacity:1; transform:translateX(0);}
    }
    .rca-card-header{
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:10px;
      margin-bottom:10px;
    }
    .rca-card-title{
      font-weight:600;
      font-size:15px;
    }
    .rca-card-sub{
      font-size:12.5px;
      color:var(--muted);
    }
    .rca-breadcrumb{
      font-size:11.5px;
      color:var(--muted);
      display:flex;
      gap:6px;
      align-items:center;
      flex-wrap:wrap;
    }
    .rca-breadcrumb span.dot{
      width:4px;
      height:4px;
      border-radius:999px;
      background:rgba(255,255,255,.3);
    }
    .rca-choices{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      margin-top:12px;
    }
    .rca-choice{
      flex:1 1 160px;
      min-width:160px;
      padding:10px 12px;
      border-radius:12px;
      border:1px solid var(--border);
      cursor:pointer;
      font-size:13px;
      background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01));
      display:flex;
      flex-direction:column;
      gap:4px;
      transition:.18s;
    }
    .rca-choice:hover{
      transform:translateY(-1px);
      border-color:rgba(59,208,255,.45);
      box-shadow:0 16px 38px rgba(0,174,239,.35);
    }
    .rca-choice-main{
      font-weight:500;
    }
    .rca-choice-sub{
      font-size:11.5px;
      color:var(--muted);
    }
    .rca-subsystems-row{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      margin-top:12px;
    }
    .rca-sub-card{
      flex:1 1 160px;
      min-width:160px;
      padding:10px 12px;
      border-radius:12px;
      border:1px solid var(--border);
      cursor:pointer;
      background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01));
      display:flex;
      flex-direction:column;
      gap:4px;
      position:relative;
      transition:.18s;
    }
    .rca-sub-card:hover{
      transform:translateY(-1px);
      border-color:rgba(59,208,255,.45);
      box-shadow:0 16px 38px rgba(0,0,0,.45);
    }
    .rca-sub-title{
      font-weight:500;
      font-size:13px;
    }
    .rca-sub-mech{
      font-size:11px;
      color:var(--muted);
      text-transform:uppercase;
      letter-spacing:.6px;
    }
    .rca-sub-desc{
      font-size:11.5px;
      color:var(--muted);
    }
    .rca-sub-pill{
      position:absolute;
      top:8px;
      right:8px;
      font-size:10px;
      border-radius:999px;
      padding:2px 6px;
      border:1px solid rgba(255,255,255,.15);
      color:var(--muted);
    }
    .rca-sub-pill.ok{
      border-color:rgba(74,222,128,.7);
      color:#bbf7d0;
    }
    .rca-sub-pill.pending{
      border-color:rgba(248,250,252,.25);
      color:#e5e7eb;
    }
    .rca-check-body{
      display:flex;
      flex-direction:column;
      gap:10px;
      margin-top:8px;
    }
    .rca-spec-line{
      font-size:12.5px;
      color:var(--muted);
    }
    .rca-input-row{
      display:flex;
      align-items:center;
      gap:10px;
      flex-wrap:wrap;
    }
    .rca-input-row input[type="number"]{
      max-width:120px;
    }
    .rca-spec-bar{
      position:relative;
      width:100%;
      max-width:320px;
      height:8px;
      border-radius:999px;
      background:rgba(255,255,255,.04);
      overflow:hidden;
    }
    .rca-spec-bar span.range{
      position:absolute;
      top:0;left:0;
      bottom:0;
      width:0%;
      border-radius:999px;
      background:linear-gradient(90deg,var(--accent),var(--accent2));
      opacity:.8;
    }
    .rca-spec-bar span.cursor{
      position:absolute;
      top:-2px;
      width:3px;
      bottom:-2px;
      border-radius:999px;
      background:#fff;
      box-shadow:0 0 10px rgba(255,255,255,.8);
    }
    .rca-prompt{
      font-size:12px;
      color:var(--muted);
      border-left:2px solid rgba(59,208,255,.4);
      padding-left:8px;
      margin-top:4px;
    }
    .rca-multi-table{
      width:100%;
      max-width:420px;
      border-collapse:collapse;
      font-size:12.5px;
      margin-top:4px;
    }
    .rca-multi-table th,
    .rca-multi-table td{
      border-bottom:1px solid rgba(255,255,255,.06);
      padding:4px 6px;
      text-align:left;
    }
    .rca-multi-table th{
      font-weight:500;
      color:var(--muted);
    }
    .rca-multi-table input[type="number"]{
      width:80px;
    }
    .rca-actions{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:8px;
      margin-top:14px;
      flex-wrap:wrap;
    }
    .rca-actions-right{
      display:flex;
      gap:8px;
      flex-wrap:wrap;
    }
    .rca-bool-row{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      margin-top:8px;
    }
    .rca-summary-grid{
      display:grid;
      gap:10px;
      grid-template-columns:1.4fr 1fr;
    }
    @media (max-width:900px){
      .rca-summary-grid{grid-template-columns:1fr}
    }
    .rca-summary-list{
      font-size:12.5px;
      display:flex;
      flex-direction:column;
      gap:4px;
    }
    .rca-summary-item strong{
      color:#e5f2ff;
    }
    .rca-summary-badge{
      font-size:11px;
      padding:1px 7px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,.15);
      color:var(--muted);
      margin-left:6px;
    }
    .rca-summary-badge.bad{
      border-color:rgba(255,73,103,.7);
      color:#fecaca;
    }
    .rca-summary-badge.ok{
      border-color:rgba(74,222,128,.7);
      color:#bbf7d0;
    }
    `;
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  })();

  /* ---------- State ---------- */
  const state = {
    issueKey: null,
    stage: "issue", // 'issue' | 'triage' | 'subsystem' | 'checks' | 'summary'
    triageAnswers: {},
    branchKey: null,
    subsystemKey: null,
    checkAnswers: {}, // { [subsystemKey]: { [checkId]: answer } }
    checkIndex: 0
  };

  const root = document.getElementById("page-diagnosis");

  function initLayout() {
    root.innerHTML = `
      <div class="rca-shell panel">
        <div class="rca-header">
          <div>
            <div style="font-size:13px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;">Root Cause Analyzer</div>
            <div style="font-size:16px;font-weight:600;margin-top:2px;">Fishbone Troubleshoot Wizard</div>
          </div>
          <div class="rca-issues" id="rcaIssues"></div>
          <div class="rca-progress">
            <div class="rca-progress-bar"><div id="rcaProgressBar"></div></div>
            <div class="rca-progress-label">
              <span id="rcaProgressLabelLeft">Idle</span>
              <span id="rcaProgressLabelRight">0%</span>
            </div>
          </div>
        </div>
        <div class="rca-stage" id="rcaStage"></div>
      </div>
    `;
    renderIssues();
    goStage("issue");
  }

  /* ---------- Issue selection ---------- */
  function renderIssues() {
    const wrap = document.getElementById("rcaIssues");
    const map = [
      { key: "setoff", label: "SetOff" },
      { key: "scratches", label: "Scratches" },
      { key: "uniformity", label: "Uniformity" },
      { key: "pq", label: "PQ" }
    ];
    wrap.innerHTML = map
      .filter(m => DATA[m.key])
      .map(m => {
        const active = state.issueKey === m.key ? "active" : "";
        return `<button class="rca-issue-pill ${active}" data-issue="${m.key}">
          <span>${m.label}</span>
          <span class="badge">${DATA[m.key].title || ""}</span>
        </button>`;
      })
      .join("");

    wrap.querySelectorAll(".rca-issue-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-issue");
        selectIssue(key);
      });
    });
  }

  function selectIssue(key) {
    if (!DATA[key]) return;
    state.issueKey = key;
    state.stage = "triage";
    state.triageAnswers = {};
    state.branchKey = null;
    state.subsystemKey = null;
    state.checkIndex = 0;
    if (!state.checkAnswers) state.checkAnswers = {};
    state.checkAnswers[key] = {};
    renderIssues();
    goStage("triage");
  }

  /* ---------- Stage control ---------- */
  function goStage(stage) {
    state.stage = stage;
    updateProgress();
    const stageEl = document.getElementById("rcaStage");
    if (!state.issueKey) {
      stageEl.innerHTML = renderIssueIntro();
      return;
    }

    if (stage === "issue") {
      stageEl.innerHTML = renderIssueIntro();
    } else if (stage === "triage") {
      stageEl.innerHTML = renderTriageCard();
      attachTriageHandlers();
    } else if (stage === "subsystem") {
      stageEl.innerHTML = renderSubsystemCard();
      attachSubsystemHandlers();
    } else if (stage === "checks") {
      stageEl.innerHTML = renderCheckCard();
      attachCheckHandlers();
    } else if (stage === "summary") {
      stageEl.innerHTML = renderSummaryCard();
      attachSummaryHandlers();
    }
  }

  function updateProgress() {
    const bar = document.getElementById("rcaProgressBar");
    const l = document.getElementById("rcaProgressLabelLeft");
    const r = document.getElementById("rcaProgressLabelRight");

    if (!bar || !l || !r) return;

    let percent = 0;
    let stageName = "Idle";

    if (state.issueKey) {
      const issue = DATA[state.issueKey];
      const triageCount = (issue.triage || []).length;
      const hasSubsystem = !!state.subsystemKey;
      const subsys = hasSubsystem
        ? (issue.subsystems && issue.subsystems[state.subsystemKey]) || null
        : null;
      const checksCount = subsys && subsys.checks ? subsys.checks.length : 0;

      const totalUnits = 1 + triageCount + (state.branchKey ? 1 : 0) + checksCount + 1;
      let done = 1; // issue selected

      if (state.stage === "issue") {
        stageName = "Select issue";
      } else {
        done += Object.keys(state.triageAnswers || {}).length;
        if (state.branchKey) done += 1;
        if (state.stage === "checks" || state.stage === "summary") {
          done += state.checkIndex;
        }
        if (state.stage === "summary") {
          done += 1;
        }
        if (state.stage === "triage") stageName = "Triage";
        else if (state.stage === "subsystem") stageName = "Subsystem selection";
        else if (state.stage === "checks") stageName = "Subsystem checks";
        else if (state.stage === "summary") stageName = "Summary";
      }
      percent = Math.max(5, Math.min(100, Math.round((done / totalUnits) * 100)));
    }

    bar.style.width = percent + "%";
    l.textContent = stageName;
    r.textContent = percent + "%";
  }

  /* ---------- Renders ---------- */

  function renderIssueIntro() {
    const items = [
      { key: "setoff", label: "SetOff", desc: "Ink/Coating transfer & drying related issues." },
      { key: "scratches", label: "Scratches", desc: "Mechanical or media related surface scratches." },
      { key: "uniformity", label: "Uniformity", desc: "Density, banding and print uniformity issues." },
      { key: "pq", label: "PQ", desc: "General print quality investigation." }
    ].filter(i => DATA[i.key]);

    return `
      <div class="rca-card">
        <div class="rca-card-header">
          <div>
            <div class="rca-card-title">Select an issue to start the RCA wizard</div>
            <div class="rca-card-sub">The flow is fully guided – based on your VISIO fishbone and machine specs.</div>
          </div>
        </div>
        <div class="rca-choices">
          ${items
            .map(
              i => `
            <div class="rca-choice" data-issue-start="${i.key}">
              <div class="rca-choice-main">${i.label}</div>
              <div class="rca-choice-sub">${i.desc}</div>
            </div>`
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function renderTriageCard() {
    const issue = DATA[state.issueKey];
    const triage = issue.triage || [];
    const q = triage[0]; // כרגע יש אחת, אבל בנוי להתרחבות
    if (!q) {
      // אין טריאג' – קופצים ישר לסאב סיסטם
      setDefaultBranch();
      return renderSubsystemCard();
    }

    const optionsHtml = (q.options || [])
      .map(
        opt => `
        <div class="rca-choice" data-triage="${q.id}" data-value="${opt.value}">
          <div class="rca-choice-main">${opt.label}</div>
          ${
            opt.desc
              ? `<div class="rca-choice-sub">${opt.desc}</div>`
              : ""
          }
        </div>`
      )
      .join("");

    return `
      <div class="rca-card">
        <div class="rca-card-header">
          <div>
            <div class="rca-card-title">${issue.title} – Triage</div>
            <div class="rca-card-sub">${q.label}</div>
          </div>
          <div class="rca-breadcrumb">
            <span>Issue:</span><span>${issue.title}</span>
            <span class="dot"></span>
            <span>Triage</span>
          </div>
        </div>
        <div class="rca-card-sub" style="margin-bottom:8px;">
          ${q.help || "Select the scenario that best matches the observed problem."}
        </div>
        <div class="rca-choices">
          ${optionsHtml}
        </div>
        <div class="rca-actions">
          <button class="btn small ghost" data-rca-back-issue>← Back to issues</button>
        </div>
      </div>
    `;
  }

  function renderSubsystemCard() {
    const issue = DATA[state.issueKey];
    const subs = issue.subsystems || {};
    const keys = getBranchSubsystems(issue) || Object.keys(subs);

    const cards = (keys || [])
      .filter(k => subs[k])
      .map(subKey => {
        const s = subs[subKey];
        const pending = !s.checks || !s.checks.length;
        const pillClass = pending ? "pending" : "ok";
        const pillText = pending ? "Soon" : "Ready";
        return `
        <div class="rca-sub-card" data-subsystem="${subKey}">
          <div class="rca-sub-title">${s.title || subKey}</div>
          <div class="rca-sub-mech">${(s.mechanism || "subsystem").toUpperCase()}</div>
          <div class="rca-sub-desc">${s.description || ""}</div>
          <div class="rca-sub-pill ${pillClass}">${pillText}</div>
        </div>`;
      })
      .join("");

    return `
      <div class="rca-card">
        <div class="rca-card-header">
          <div>
            <div class="rca-card-title">${issue.title} – Subsystems</div>
            <div class="rca-card-sub">Select the subsystem you want to diagnose first.</div>
          </div>
          <div class="rca-breadcrumb">
            <span>Issue:</span><span>${issue.title}</span>
            <span class="dot"></span>
            <span>Subsystems</span>
          </div>
        </div>
        <div class="rca-subsystems-row">
          ${cards || "<div class='rca-card-sub'>No subsystems configured yet.</div>"}
        </div>
        <div class="rca-actions">
          <button class="btn small ghost" data-rca-back-triage>← Back</button>
        </div>
      </div>
    `;
  }

  function renderCheckCard() {
    const issue = DATA[state.issueKey];
    const subs = issue.subsystems || {};
    const sub = subs[state.subsystemKey];
    if (!sub || !sub.checks || !sub.checks.length) {
      return `
        <div class="rca-card">
          <div class="rca-card-header">
            <div>
              <div class="rca-card-title>No checks defined</div>
              <div class="rca-card-sub">This subsystem has no checks yet.</div>
            </div>
          </div>
          <div class="rca-actions">
            <button class="btn small ghost" data-rca-back-subsystems>← Back to subsystems</button>
          </div>
        </div>`;
    }

    const idx = Math.min(state.checkIndex, sub.checks.length - 1);
    const check = sub.checks[idx];
    const total = sub.checks.length;
    const currentIdx = idx + 1;

    const bc = `
      <div class="rca-breadcrumb">
        <span>Issue:</span><span>${issue.title}</span>
        <span class="dot"></span>
        <span>Subsystem:</span><span>${sub.title || state.subsystemKey}</span>
        <span class="dot"></span>
        <span>Check ${currentIdx}/${total}</span>
      </div>`;

    let body = "";
    if (check.type === "range") {
      body = renderRangeCheck(sub, check);
    } else if (check.type === "multiRange") {
      body = renderMultiRangeCheck(sub, check);
    } else if (check.type === "boolean") {
      body = renderBooleanCheck(sub, check);
    } else {
      body = renderTextCheck(sub, check);
    }

    return `
      <div class="rca-card">
        <div class="rca-card-header">
          <div>
            <div class="rca-card-title">${sub.title || state.subsystemKey}</div>
            <div class="rca-card-sub">${check.label || ""}</div>
          </div>
          ${bc}
        </div>
        <div class="rca-check-body">
          ${body}
        </div>
        <div class="rca-actions">
          <button class="btn small ghost" data-rca-back-subsystems>← Subsystems</button>
          <div class="rca-actions-right">
            <button class="btn small ghost" data-rca-prev-check>Previous</button>
            <button class="btn small primary" data-rca-next-check>${currentIdx === total ? "Finish subsystem" : "Next check →"}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderRangeCheck(sub, check) {
    const answer = getAnswer(sub.id, check.id);
    const v = answer && typeof answer.value === "number" ? answer.value : "";
    const unit = check.unit || "";
    const spec = check.spec || {};
    const min = spec.min != null ? spec.min : "";
    const max = spec.max != null ? spec.max : "";
    let specText = "";
    if (min !== "" && max !== "") specText = `Target range: ${min}–${max} ${unit}`;
    else if (min !== "") specText = `Minimum: ${min} ${unit}`;
    else if (max !== "") specText = `Maximum: ${max} ${unit}`;

    const bar = spec && min !== "" && max !== "" && typeof v === "number";
    let cursorLeft = 0;
    if (bar) {
      const span = max - min || 1;
      cursorLeft = Math.max(0, Math.min(100, ((v - min) / span) * 100));
    }

    return `
      <div class="rca-spec-line">${specText}</div>
      <div class="rca-input-row">
        <label style="font-size:12.5px;">Measured value:</label>
        <input type="number" step="0.01" class="input v13" data-rca-input="range" data-check-id="${check.id}" value="${v !== "" ? v : ""}">
        <span style="font-size:12.5px;color:var(--muted);">${unit}</span>
      </div>
      ${
        bar
          ? `<div class="rca-spec-bar">
              <span class="range" style="width:100%;"></span>
              <span class="cursor" style="left:${cursorLeft}%;"></span>
            </div>`
          : ""
      }
      ${
        check.prompt
          ? `<div class="rca-prompt">${check.prompt}</div>`
          : ""
      }
    `;
  }

  function renderMultiRangeCheck(sub, check) {
    const answer = getAnswer(sub.id, check.id) || { values: {} };
    const unit = check.unit || "";
    const rows = (check.points || [])
      .map(p => {
        const v = answer.values && typeof answer.values[p.id] === "number"
          ? answer.values[p.id]
          : "";
        return `
        <tr>
          <td>${p.label}</td>
          <td>${p.target} ${unit}</td>
          <td><input type="number" step="0.1" class="input v13" data-rca-input="multi" data-check-id="${check.id}" data-point-id="${p.id}" value="${v !== "" ? v : ""}"></td>
        </tr>`;
      })
      .join("");

    return `
      <div class="rca-spec-line">${check.label}</div>
      <table class="rca-multi-table">
        <thead>
          <tr><th>Point</th><th>Target</th><th>Measured</th></tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      ${
        check.prompt
          ? `<div class="rca-prompt">${check.prompt}</div>`
          : ""
      }
    `;
  }

  function renderBooleanCheck(sub, check) {
    const answer = getAnswer(sub.id, check.id);
    const val = answer && typeof answer.value === "boolean" ? answer.value : null;
    return `
      <div class="rca-spec-line">Select the result of this check:</div>
      <div class="rca-bool-row">
        <button class="btn small ${val === true ? "primary" : ""}" data-rca-bool="${check.id}" data-value="ok">OK</button>
        <button class="btn small ${val === false ? "primary" : ""}" data-rca-bool="${check.id}" data-value="not_ok">Not OK</button>
      </div>
      ${
        check.prompt
          ? `<div class="rca-prompt">${check.prompt}</div>`
          : ""
      }
    `;
  }

  function renderTextCheck(sub, check) {
    const answer = getAnswer(sub.id, check.id) || {};
    const txt = answer.text || "";
    return `
      <div class="rca-spec-line">${check.label}</div>
      <textarea class="input v13" data-rca-input="text" data-check-id="${check.id}" placeholder="Describe the observation...">${txt}</textarea>
      ${
        check.prompt
          ? `<div class="rca-prompt">${check.prompt}</div>`
          : ""
      }
    `;
  }

  function renderSummaryCard() {
    const issue = DATA[state.issueKey];
    const subs = issue.subsystems || {};
    const sub = subs[state.subsystemKey];
    const answers = state.checkAnswers[sub.id] || {};
    const anomalies = [];
    const normals = [];

    (sub.checks || []).forEach(ch => {
      const a = answers[ch.id];
      if (!a) return;

      if (ch.type === "range" && ch.spec) {
        const v = a.value;
        if (typeof v === "number") {
          const min = ch.spec.min;
          const max = ch.spec.max;
          const bad = (min != null && v < min) || (max != null && v > max);
          const entry = { check: ch, value: v, unit: ch.unit || "", kind: "range" };
          if (bad) anomalies.push(entry);
          else normals.push(entry);
        }
      } else if (ch.type === "boolean") {
        const bad = a.value === false;
        const entry = { check: ch, value: a.value, kind: "boolean" };
        if (bad) anomalies.push(entry);
        else normals.push(entry);
      } else if (ch.type === "multiRange") {
        normals.push({ check: ch, value: a.values, kind: "multiRange" });
      } else {
        normals.push({ check: ch, value: a.text, kind: "text" });
      }
    });

    const anomalyList =
      anomalies.length === 0
        ? `<div class="rca-summary-item">No out-of-spec readings detected for this subsystem.</div>`
        : anomalies
            .map(item => {
              if (item.kind === "range") {
                return `<div class="rca-summary-item">
                  <strong>${item.check.label}</strong>
                  <span class="rca-summary-badge bad">Out of spec</span><br>
                  Value: ${item.value} ${item.unit || ""} &nbsp;|&nbsp;
                  Target: ${item.check.spec.min}–${item.check.spec.max} ${item.unit || ""}
                  ${item.check.prompt ? `<br><span style="color:var(--muted);font-size:12px;">${item.check.prompt}</span>` : ""}
                </div>`;
              } else if (item.kind === "boolean") {
                return `<div class="rca-summary-item">
                  <strong>${item.check.label}</strong>
                  <span class="rca-summary-badge bad">NOT OK</span>
                  ${item.check.prompt ? `<br><span style="color:var(--muted);font-size:12px;">${item.check.prompt}</span>` : ""}
                </div>`;
              }
              return "";
            })
            .join("");

    const normalList =
      normals.length === 0
        ? `<div class="rca-summary-item">No additional notes recorded.</div>`
        : normals
            .map(item => {
              if (item.kind === "range") {
                return `<div class="rca-summary-item">
                  <strong>${item.check.label}</strong>
                  <span class="rca-summary-badge ok">Within range</span><br>
                  Value: ${item.value} ${item.unit || ""} &nbsp;|&nbsp;
                  Target: ${item.check.spec.min}–${item.check.spec.max} ${item.unit || ""}
                </div>`;
              } else if (item.kind === "boolean") {
                return `<div class="rca-summary-item">
                  <strong>${item.check.label}</strong>
                  <span class="rca-summary-badge ok">OK</span>
                </div>`;
              } else if (item.kind === "multiRange") {
                return `<div class="rca-summary-item">
                  <strong>${item.check.label}</strong>
                  <span class="rca-summary-badge">Recorded</span>
                </div>`;
              } else if (item.kind === "text") {
                return `<div class="rca-summary-item">
                  <strong>${item.check.label}</strong><br>
                  <span style="color:var(--muted);font-size:12px;">${item.value || ""}</span>
                </div>`;
              }
              return "";
            })
            .join("");

    return `
      <div class="rca-card">
        <div class="rca-card-header">
          <div>
            <div class="rca-card-title">${issue.title} – Summary</div>
            <div class="rca-card-sub">${sub.title || state.subsystemKey}</div>
          </div>
          <div class="rca-breadcrumb">
            <span>Issue:</span><span>${issue.title}</span>
            <span class="dot"></span>
            <span>Summary</span>
          </div>
        </div>
        <div class="rca-summary-grid">
          <div>
            <div style="font-size:13px;font-weight:500;margin-bottom:6px;">Potential root causes (out-of-spec)</div>
            <div class="rca-summary-list">
              ${anomalyList}
            </div>
          </div>
          <div>
            <div style="font-size:13px;font-weight:500;margin-bottom:6px;">Additional findings</div>
            <div class="rca-summary-list">
              ${normalList}
            </div>
          </div>
        </div>
        <div class="rca-actions" style="margin-top:16px;">
          <button class="btn small ghost" data-rca-back-checks>← Back to checks</button>
          <div class="rca-actions-right">
            <button class="btn small" data-rca-reset>Start new RCA</button>
          </div>
        </div>
      </div>
    `;
  }

  /* ---------- Handlers ---------- */

  function attachTriageHandlers() {
    const stageEl = document.getElementById("rcaStage");
    if (!stageEl) return;
    stageEl.querySelectorAll("[data-issue-start]").forEach(el => {
      el.addEventListener("click", () => {
        const key = el.getAttribute("data-issue-start");
        selectIssue(key);
      });
    });
    const qEls = stageEl.querySelectorAll("[data-triage]");
    qEls.forEach(el => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-triage");
        const val = el.getAttribute("data-value");
        state.triageAnswers[id] = val;
        // branch key מתוך הטריאג' הראשון
        const issue = DATA[state.issueKey];
        if (issue && issue.triage && issue.triage.length > 0 && issue.triage[0].id === id) {
          state.branchKey = val;
        }
        goStage("subsystem");
      });
    });

    const backIssue = stageEl.querySelector("[data-rca-back-issue]");
    if (backIssue) backIssue.addEventListener("click", () => goStage("issue"));
  }

  function attachSubsystemHandlers() {
    const stageEl = document.getElementById("rcaStage");
    if (!stageEl) return;
    stageEl.querySelectorAll("[data-subsystem]").forEach(el => {
      el.addEventListener("click", () => {
        const key = el.getAttribute("data-subsystem");
        const issue = DATA[state.issueKey];
        const sub = issue.subsystems && issue.subsystems[key];
        if (!sub || !sub.checks || !sub.checks.length) {
          // עוד אין בדיקות לסאב-סיסטם הזה
          return;
        }
        state.subsystemKey = key;
        state.checkIndex = 0;
        if (!state.checkAnswers[key]) state.checkAnswers[key] = {};
        goStage("checks");
      });
    });

    const backTri = stageEl.querySelector("[data-rca-back-triage]");
    if (backTri) backTri.addEventListener("click", () => goStage("triage"));
  }

  function attachCheckHandlers() {
    const stageEl = document.getElementById("rcaStage");
    if (!stageEl) return;

    // range inputs
    stageEl.querySelectorAll('[data-rca-input="range"]').forEach(input => {
      input.addEventListener("input", () => {
        const v = parseFloat(input.value);
        const cid = input.getAttribute("data-check-id");
        if (!cid) return;
        const subId = state.subsystemKey;
        if (!state.checkAnswers[subId]) state.checkAnswers[subId] = {};
        if (!state.checkAnswers[subId][cid]) state.checkAnswers[subId][cid] = { kind: "range" };
        if (!isNaN(v)) state.checkAnswers[subId][cid].value = v;
        else delete state.checkAnswers[subId][cid].value;
      });
    });

    // multi-range inputs
    stageEl.querySelectorAll('[data-rca-input="multi"]').forEach(input => {
      input.addEventListener("input", () => {
        const v = parseFloat(input.value);
        const cid = input.getAttribute("data-check-id");
        const pid = input.getAttribute("data-point-id");
        if (!cid || !pid) return;
        const subId = state.subsystemKey;
        if (!state.checkAnswers[subId]) state.checkAnswers[subId] = {};
        if (!state.checkAnswers[subId][cid]) state.checkAnswers[subId][cid] = { kind: "multiRange", values: {} };
        if (!state.checkAnswers[subId][cid].values)
          state.checkAnswers[subId][cid].values = {};
        if (!isNaN(v)) state.checkAnswers[subId][cid].values[pid] = v;
        else delete state.checkAnswers[subId][cid].values[pid];
      });
    });

    // boolean
    stageEl.querySelectorAll("[data-rca-bool]").forEach(btn => {
      btn.addEventListener("click", () => {
        const cid = btn.getAttribute("data-rca-bool");
        const val = btn.getAttribute("data-value");
        const subId = state.subsystemKey;
        if (!state.checkAnswers[subId]) state.checkAnswers[subId] = {};
        if (!state.checkAnswers[subId][cid]) state.checkAnswers[subId][cid] = { kind: "boolean" };
        state.checkAnswers[subId][cid].value = val === "ok";

        // עדכון מראה הכפתורים
        stageEl.querySelectorAll(`[data-rca-bool="${cid}"]`).forEach(b => {
          const v = b.getAttribute("data-value");
          if ((v === "ok" && val === "ok") || (v === "not_ok" && val === "not_ok")) {
            b.classList.add("primary");
          } else {
            b.classList.remove("primary");
          }
        });
      });
    });

    // text
    stageEl.querySelectorAll('[data-rca-input="text"]').forEach(input => {
      input.addEventListener("input", () => {
        const cid = input.getAttribute("data-check-id");
        const txt = input.value || "";
        const subId = state.subsystemKey;
        if (!state.checkAnswers[subId]) state.checkAnswers[subId] = {};
        state.checkAnswers[subId][cid] = { kind: "text", text: txt };
      });
    });

    const backSubs = stageEl.querySelector("[data-rca-back-subsystems]");
    if (backSubs)
      backSubs.addEventListener("click", () => {
        state.checkIndex = 0;
        goStage("subsystem");
      });

    const prev = stageEl.querySelector("[data-rca-prev-check]");
    const next = stageEl.querySelector("[data-rca-next-check]");
    const issue = DATA[state.issueKey];
    const sub = issue.subsystems[state.subsystemKey];
    const total = sub.checks.length;

    if (prev) {
      prev.addEventListener("click", () => {
        state.checkIndex = Math.max(0, state.checkIndex - 1);
        goStage("checks");
      });
    }
    if (next) {
      next.addEventListener("click", () => {
        if (state.checkIndex >= total - 1) {
          goStage("summary");
        } else {
          state.checkIndex = Math.min(total - 1, state.checkIndex + 1);
          goStage("checks");
        }
      });
    }
  }

  function attachSummaryHandlers() {
    const stageEl = document.getElementById("rcaStage");
    if (!stageEl) return;
    const back = stageEl.querySelector("[data-rca-back-checks]");
    if (back) back.addEventListener("click", () => goStage("checks"));
    const reset = stageEl.querySelector("[data-rca-reset]");
    if (reset) reset.addEventListener("click", () => {
      state.issueKey = null;
      state.stage = "issue";
      state.triageAnswers = {};
      state.branchKey = null;
      state.subsystemKey = null;
      state.checkAnswers = {};
      state.checkIndex = 0;
      renderIssues();
      goStage("issue");
    });
  }

  /* ---------- Helpers ---------- */

  function getBranchSubsystems(issue) {
    if (!issue) return null;
    if (!state.branchKey) return null;
    const tb = issue.triageBranch || {};
    return tb[state.branchKey] || null;
  }

  function setDefaultBranch() {
    const issue = DATA[state.issueKey];
    if (!issue) return;
    const keys = Object.keys(issue.subsystems || {});
    state.branchKey = null;
    if (!state.subsystemKey && keys.length) state.subsystemKey = keys[0];
  }

  function getAnswer(subId, checkId) {
    if (!state.checkAnswers || !state.checkAnswers[subId]) return null;
    return state.checkAnswers[subId][checkId] || null;
  }

  /* ---------- Init ---------- */

  initLayout();
})();
