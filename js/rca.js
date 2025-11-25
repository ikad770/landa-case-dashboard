/* Root Cause Analyzer – UI & logic
 * Uses: RCA_DATA from data/rca-data.js
 */

(function () {
  "use strict";

  const state = {
    currentStep: 1,
    issueId: null,
    answers: {},        // paramId -> value
    specResult: {}      // paramId -> "ok" / "bad"
  };

  function qs(sel) {
    return document.querySelector(sel);
  }
  function qsa(sel) {
    return Array.from(document.querySelectorAll(sel));
  }

  /* ---------- Stepper visuals ---------- */

  function updateStepper() {
    const total = 3;
    const track = qs("#wizardTrack");
    const steps = qsa(".wizard-stepper .wizard-step");
    const ratio = (state.currentStep - 1) / (total - 1);
    track.style.width = `${ratio * 100}%`;

    steps.forEach((s) => {
      const stepNum = Number(s.getAttribute("data-step"));
      s.classList.toggle("active", stepNum === state.currentStep);
      s.classList.toggle("done", stepNum < state.currentStep);
    });
  }

  function showStep(step) {
    state.currentStep = step;
    qs("#wizStep1").classList.toggle("hidden", step !== 1);
    qs("#wizStep2").classList.toggle("hidden", step !== 2);
    qs("#wizStep3").classList.toggle("hidden", step !== 3);
    updateStepper();
    updateFooterButtons();
    updateSnapshot();
  }

  function updateFooterButtons() {
    const prev = qs("#btnPrevRCA");
    const next = qs("#btnNextRCA");
    prev.disabled = state.currentStep === 1;

    if (state.currentStep === 3) {
      next.textContent = "Finish";
    } else if (state.currentStep === 1) {
      next.textContent = "Start checks";
    } else {
      next.textContent = "Next";
    }
  }

  /* ---------- Issue selection (step 1) ---------- */

  function initIssues() {
    const pills = qsa(".issue-pill");
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        state.issueId = pill.getAttribute("data-issue");
        updateSnapshot();
      });
    });
  }

  /* ---------- IRD questions (step 2) ---------- */

  function renderIRD() {
    const wrap = qs("#irdQuestions");
    if (!wrap || !window.RCA_DATA || !RCA_DATA.IRD) return;

    wrap.innerHTML = "";

    RCA_DATA.IRD.forEach((row) => {
      const line = document.createElement("div");
      line.className = "ird-row";
      line.dataset.id = row.id;

      const label = document.createElement("div");
      label.className = "ird-label";
      label.textContent = row.label;
      line.appendChild(label);

      const spec = document.createElement("div");
      spec.className = "ird-spec";
      if (row.type === "range") {
        spec.textContent = `${row.min} – ${row.max} ${row.unit || ""}`.trim();
      } else {
        spec.textContent = row.tip || "";
      }
      line.appendChild(spec);

      const iw = document.createElement("div");
      iw.className = "ird-input-wrap";

      let input;
      if (row.type === "boolean") {
        input = document.createElement("input");
        input.type = "checkbox";
      } else {
        input = document.createElement("input");
        input.type = "number";
        input.inputMode = "decimal";
        input.placeholder = row.unit || "";
      }
      input.dataset.id = row.id;
      iw.appendChild(input);

      const pill = document.createElement("span");
      pill.className = "ird-pill";
      pill.textContent = "Not evaluated";
      iw.appendChild(pill);

      line.appendChild(iw);
      wrap.appendChild(line);

      // events
      if (row.type === "boolean") {
        input.addEventListener("change", () => {
          const val = !!input.checked;
          state.answers[row.id] = val;
          state.specResult[row.id] = val ? "ok" : "bad";
          pill.textContent = val ? "OK" : "Not OK";
          pill.classList.toggle("ok", val);
          pill.classList.toggle("bad", !val);
          updateSnapshot();
        });
      } else {
        input.addEventListener("input", () => {
          const v = Number(input.value);
          if (!input.value) {
            pill.textContent = "Not evaluated";
            pill.classList.remove("ok", "bad");
            delete state.answers[row.id];
            delete state.specResult[row.id];
          } else {
            const ok = v >= row.min && v <= row.max;
            state.answers[row.id] = v;
            state.specResult[row.id] = ok ? "ok" : "bad";
            pill.textContent = ok ? "In spec" : "Out of spec";
            pill.classList.toggle("ok", ok);
            pill.classList.toggle("bad", !ok);
          }
          updateSnapshot();
        });
      }
    });
  }

  /* ---------- Snapshot side panel ---------- */

  function updateSnapshot() {
    const box = qs("#wizSnapshot");
    if (!box) return;
    box.innerHTML = "";

    const issue =
      RCA_DATA.issues && RCA_DATA.issues.find((x) => x.id === state.issueId);

    const addRow = (label, value) => {
      const row = document.createElement("div");
      row.className = "mini-row";
      row.innerHTML = `<span>${label}</span><span>${value}</span>`;
      box.appendChild(row);
    };

    if (issue) {
      addRow("Issue", issue.label);
    } else {
      addRow("Issue", "Not selected");
    }

    const answered = Object.keys(state.answers).length;
    if (answered > 0) {
      const bad = Object.values(state.specResult).filter((v) => v === "bad")
        .length;
      addRow("IRD answered", String(answered));
      addRow("Out of spec", String(bad));
    } else {
      addRow("IRD checks", "Not started");
    }
  }

  /* ---------- Diagnosis (step 3) ---------- */

  function buildDiagnosis() {
    const box = qs("#diagSummary");
    if (!box) return;
    box.innerHTML = "";

    const list = RCA_DATA.IRD || [];
    const badIds = Object.keys(state.specResult).filter(
      (id) => state.specResult[id] === "bad"
    );

    const title = document.createElement("div");
    title.className = "diag-tagline";

    if (!state.issueId) {
      title.textContent = "Please select an issue in step 1.";
      box.appendChild(title);
      return;
    }

    if (!list.length) {
      title.textContent = "No IRD data defined.";
      box.appendChild(title);
      return;
    }

    if (badIds.length === 0) {
      title.textContent = "No clear IRD problem detected.";
      box.appendChild(title);

      const p = document.createElement("div");
      p.className = "diag-list";
      p.innerHTML =
        "All measured parameters are within spec. Continue with the fishbone path: check IPS → BCU → HA → BCS → STS / DFE as described in the SetOff troubleshooting diagram.";
      box.appendChild(p);
      return;
    }

    title.textContent = "IRD parameters out of spec";
    box.appendChild(title);

    const ul = document.createElement("ul");
    ul.className = "diag-list";

    badIds.forEach((id) => {
      const row = list.find((r) => r.id === id);
      if (!row) return;
      const li = document.createElement("li");
      const specText =
        row.type === "range"
          ? `Spec: ${row.min} – ${row.max} ${row.unit || ""}`.trim()
          : row.tip || "";
      li.textContent = `${row.label} – out of spec. ${specText}`;
      ul.appendChild(li);
    });

    box.appendChild(ul);

    const hint = document.createElement("div");
    hint.className = "diag-list";
    hint.style.marginTop = "6px";
    hint.innerHTML =
      "Focus the next troubleshooting steps on IRD hardware (fans, slits, sensors) and drying capacity. If problems remain after fixing IRD, continue with the downstream subsystems along the fishbone chart.";
    box.appendChild(hint);
  }

  /* ---------- Navigation buttons ---------- */

  function handleNext() {
    if (state.currentStep === 1) {
      if (!state.issueId) {
        alert("Please select an issue first.");
        return;
      }
      showStep(2);
    } else if (state.currentStep === 2) {
      showStep(3);
      buildDiagnosis();
    } else {
      // step 3 -> finish = restart
      restart();
    }
  }

  function handlePrev() {
    if (state.currentStep > 1) {
      showStep(state.currentStep - 1);
    }
  }

  function restart() {
    state.currentStep = 1;
    state.issueId = null;
    state.answers = {};
    state.specResult = {};

    // reset UI
    qsa(".issue-pill").forEach((p) => p.classList.remove("active"));
    qsa(".ird-row input").forEach((inp) => {
      if (inp.type === "checkbox") inp.checked = false;
      else inp.value = "";
    });
    qsa(".ird-pill").forEach((pill) => {
      pill.textContent = "Not evaluated";
      pill.classList.remove("ok", "bad");
    });
    if (qs("#diagSummary")) qs("#diagSummary").innerHTML = "";

    showStep(1);
  }

  /* ---------- Init ---------- */

  document.addEventListener("DOMContentLoaded", () => {
    if (!qs("#rcaWizard")) return; // page not present

    initIssues();
    renderIRD();
    updateSnapshot();
    showStep(1);

    const btnNext = qs("#btnNextRCA");
    const btnPrev = qs("#btnPrevRCA");
    const btnRestart = qs("#btnRestartRCA");

    if (btnNext) btnNext.addEventListener("click", handleNext);
    if (btnPrev) btnPrev.addEventListener("click", handlePrev);
    if (btnRestart) btnRestart.addEventListener("click", restart);
  });
})();
