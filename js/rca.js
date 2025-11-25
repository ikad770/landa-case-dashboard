// js/rca.js
// Root Cause Analyzer – wizard UI

(function () {
  const pageId = "page-diagnosis";

  function getSetOffModel() {
    const data = window.RCA_DATA;
    if (!data || !data.issues) return null;
    return data.issues.find(i => i.code === "setoff") || null;
  }

  const state = {
    currentStepIndex: 0,
    answers: {}
  };

  function buildShell(model) {
    const page = document.getElementById(pageId);
    if (!page) return;
    page.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Root Cause Analyzer – ${model.title}</h2>
          <p>${model.description}</p>
        </div>
      </div>

      <div class="panel rca-layout">
        <div>
          <div class="rca-panel-title">Guided Wizard</div>
          <div class="rca-stepper" id="rcaStepper"></div>
          <div id="rcaStepContent"></div>
        </div>
        <div>
          <div class="rca-panel-title">Context & Insights</div>
          <div id="rcaContext"></div>
          <div class="fishbone" id="rcaFishbone"></div>
        </div>
      </div>
    `;
  }

  function renderStepper(model) {
    const stepper = document.getElementById("rcaStepper");
    if (!stepper) return;
    stepper.innerHTML = "";
    model.steps.forEach((s, idx) => {
      const el = document.createElement("div");
      el.className = "rca-step" + (idx === state.currentStepIndex ? " active" : "");
      el.innerHTML = `
        <div class="rca-step-dot">${idx + 1}</div>
        <span>${s.label}</span>
      `;
      el.addEventListener("click", () => {
        state.currentStepIndex = idx;
        renderAll(model);
      });
      stepper.appendChild(el);
    });
  }

  function shouldStepBeVisible(step) {
    if (!step.appliesIf) return true;
    const { field, isIn } = step.appliesIf;
    const v = state.answers[field];
    if (!isIn || !Array.isArray(isIn)) return true;
    return isIn.includes(v);
  }

  function renderStepContent(model) {
    const content = document.getElementById("rcaStepContent");
    if (!content) return;
    const step = model.steps[state.currentStepIndex];
    if (!shouldStepBeVisible(step)) {
      content.innerHTML = `<div class="rca-question">This step is not applicable based on previous answers.</div>`;
      return;
    }

    if (step.type === "choice") {
      renderChoiceStep(step, content, model);
    } else if (step.type === "checklist") {
      renderChecklistStep(step, content, model);
    } else if (step.type === "summary") {
      renderSummaryStep(step, content, model);
    } else {
      content.innerHTML = `<div>Unsupported step type.</div>`;
    }
  }

  function renderChoiceStep(step, content, model) {
    const value = state.answers[step.id] || "";
    content.innerHTML = `
      <div class="rca-question">${step.question}</div>
      <div class="rca-help">${step.help || ""}</div>
      <div class="rca-options">
        ${step.options
          .map(
            o => `
          <label class="rca-option">
            <input type="radio" name="${step.id}" value="${o.value}" ${o.value === value ? "checked" : ""}>
            <span>${o.label}</span>
          </label>
        `
          )
          .join("")}
      </div>
      <div class="rca-footer">
        <span>Step ${model.steps.indexOf(step) + 1} of ${model.steps.length}</span>
        <div>
          <button class="btn small" id="rcaPrev">Back</button>
          <button class="btn small primary rca-next" id="rcaNext">Next</button>
        </div>
      </div>
    `;
    content.querySelectorAll(`input[name="${step.id}"]`).forEach(input => {
      input.addEventListener("change", () => {
        state.answers[step.id] = input.value;
      });
    });
    attachPrevNext(model);
  }

  function renderChecklistStep(step, content, model) {
    const checked = state.answers[step.id] || {};
    content.innerHTML = `
      <div class="rca-question">${step.question}</div>
      <div class="rca-help">${step.help || ""}</div>
      <div class="rca-options">
        ${step.checks
          .map(
            c => `
          <label class="rca-option">
            <input type="checkbox" data-check="${c.id}" ${checked[c.id] ? "checked" : ""}>
            <span>
              <b>${c.label}</b><br>
              <span>${c.prompt}</span>
            </span>
          </label>
        `
          )
          .join("")}
      </div>
      <div class="rca-footer">
        <span>Mark each check as you validate it in the field.</span>
        <div>
          <button class="btn small" id="rcaPrev">Back</button>
          <button class="btn small primary rca-next" id="rcaNext">Next</button>
        </div>
      </div>
    `;
    content.querySelectorAll("input[type='checkbox']").forEach(cb => {
      cb.addEventListener("change", () => {
        const id = cb.getAttribute("data-check");
        state.answers[step.id] = state.answers[step.id] || {};
        state.answers[step.id][id] = cb.checked;
      });
    });
    attachPrevNext(model);
  }

  function renderSummaryStep(step, content, model) {
    const recs = (model.recommendations || []).slice().sort((a, b) => {
      // Highest successRate first, then lower effort
      const srDiff = (b.successRate || 0) - (a.successRate || 0);
      if (srDiff !== 0) return srDiff;
      const effortRank = { Low: 1, Medium: 2, High: 3 };
      return (effortRank[a.effort] || 3) - (effortRank[b.effort] || 3);
    });

    content.innerHTML = `
      <div class="rca-question">${step.question}</div>
      <div class="rca-help">${step.help || ""}</div>
      <ul class="rca-summary-list">
        ${recs
          .map(r => {
            const sr = Math.round((r.successRate || 0) * 100);
            return `
            <li>
              <span class="rca-badge">
                <b>${r.subsystem}</b>
                · Effort: ${r.effort}
                · Success: ${sr}%
              </span>
              <br>${r.text}
            </li>`;
          })
          .join("")}
      </ul>
      <div class="rca-footer">
        <span>Solutions are ordered from most promising & easiest → to heavier / escalation steps.</span>
        <div>
          <button class="btn small" id="rcaPrev">Back</button>
          <button class="btn small primary rca-next" id="rcaRestart">Restart</button>
        </div>
      </div>
    `;

    document.getElementById("rcaPrev")?.addEventListener("click", () => {
      if (state.currentStepIndex > 0) state.currentStepIndex--;
      renderAll(model);
    });
    document.getElementById("rcaRestart")?.addEventListener("click", () => {
      state.currentStepIndex = 0;
      state.answers = {};
      renderAll(model);
    });
  }

  function attachPrevNext(model) {
    const prev = document.getElementById("rcaPrev");
    const next = document.getElementById("rcaNext");
    prev?.addEventListener("click", () => {
      if (state.currentStepIndex > 0) state.currentStepIndex--;
      renderAll(model);
    });
    next?.addEventListener("click", () => {
      if (state.currentStepIndex < model.steps.length - 1) {
        state.currentStepIndex++;
        renderAll(model);
      }
    });
  }

  function renderContext(model) {
    const ctxEl = document.getElementById("rcaContext");
    if (!ctxEl) return;
    const cases = window.getCases ? window.getCases() : [];
    const open = cases.filter(c => c.status === "Open" || c.status === "In Progress");
    const last = open[0];

    const triageMode = state.answers["triage_mode"] || "—";
    const area = state.answers["triage_area"] || "—";
    const impact = state.answers["triage_severity"] || "—";
    const systemFocus = state.answers["system_focus"] || "—";

    ctxEl.innerHTML = `
      <div class="rca-context-row">
        <span>Selected issue:</span><span>${model.title}</span>
      </div>
      <div class="rca-context-row">
        <span>Last open case:</span><span>${last ? (last.sfCase + " · " + (last.customer || "")) : "None"}</span>
      </div>
      <div class="rca-context-row">
        <span>Triage – mode:</span><span>${triageMode}</span>
      </div>
      <div class="rca-context-row">
        <span>Triage – area:</span><span>${area}</span>
      </div>
      <div class="rca-context-row">
        <span>Impact:</span><span>${impact}</span>
      </div>
      <div class="rca-context-row">
        <span>System focus:</span><span>${systemFocus}</span>
      </div>
    `;
  }

  function renderFishbone(model) {
    const el = document.getElementById("rcaFishbone");
    if (!el) return;
    const fb = model.fishbone;
    if (!fb) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML = `
      <div class="fishbone-main">Fishbone – ${fb.effect}</div>
      <div class="fishbone-branches">
        ${fb.branches
          .map(
            b => `
          <div class="fishbone-branch">
            <div class="fishbone-branch-title">${b.category}</div>
            <ul>
              ${b.causes.map(c => `<li>${c}</li>`).join("")}
            </ul>
          </div>`
          )
          .join("")}
      </div>
    `;
  }

  function renderAll(model) {
    renderStepper(model);
    renderStepContent(model);
    renderContext(model);
    renderFishbone(model);
  }

  window.renderRCA = function () {
    const model = getSetOffModel();
    if (!model) {
      const page = document.getElementById(pageId);
      if (page) page.innerHTML = "<div class='panel'>RCA data not available.</div>";
      return;
    }
    buildShell(model);
    renderAll(model);
  };
})();
