// rca.js – Wizard logic (SetOff → IRD → diagnosis)

(function(){
  let currentStep = 1;
  let currentIssue = null;
  let answers = {}; // { id: {value, inSpec, info} }

  function $(id){ return document.getElementById(id); }

  function setStep(step){
    currentStep = step;
    const cards = [
      {step:1, el:$('wizStep1')},
      {step:2, el:$('wizStep2')},
      {step:3, el:$('wizStep3')}
    ];
    cards.forEach(c=>{
      if(!c.el) return;
      c.el.classList.toggle('hidden', c.step !== step);
    });

    const steps = document.querySelectorAll('.wizard-step');
    steps.forEach(s=>{
      const n = Number(s.getAttribute('data-step'));
      s.classList.remove('active','completed');
      if(n < step) s.classList.add('completed');
      if(n === step) s.classList.add('active');
    });

    const track = $('wizardTrack');
    if(track){
      const pct = step === 1 ? 0 : step === 2 ? 50 : 100;
      track.style.width = pct + '%';
    }

    updateSnapshot();
    if (step === 3) buildDiagnosis();
  }

  function selectIssue(issueKey){
    currentIssue = issueKey;
    document.querySelectorAll('.issue-pill').forEach(btn=>{
      btn.classList.toggle('active', btn.dataset.issue === issueKey);
    });
    updateSnapshot();
  }

  function buildIRDUI(){
    const container = $('irdQuestions');
    if (!container || !window.RCA_DATA || !RCA_DATA.IRD) return;
    container.innerHTML = '';

    RCA_DATA.IRD.forEach(q=>{
      const row = document.createElement('div');
      row.className = 'ird-row';
      row.dataset.id = q.id;

      const label = document.createElement('div');
      label.className = 'ird-label';
      label.textContent = q.label;

      const spec = document.createElement('div');
      spec.className = 'ird-spec';
      if (q.type === 'boolean') {
        spec.textContent = 'Expected: OK';
      } else if (q.min != null && q.max != null) {
        spec.textContent = `Spec: ${q.min}–${q.max} ${q.unit || ''}`;
      } else {
        spec.textContent = q.unit || '';
      }

      const inputWrap = document.createElement('div');
      if (q.type === 'boolean') {
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.addEventListener('change', ()=> onAnswerChange(q, cb.checked ? 'OK' : 'NOK'));
        inputWrap.appendChild(cb);
      } else {
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.className = 'input';
        inp.placeholder = q.unit || '';
        inp.addEventListener('input', ()=> onAnswerChange(q, inp.value));
        inputWrap.appendChild(inp);
      }

      const status = document.createElement('div');
      status.className = 'ird-status';
      status.textContent = '—';

      row.appendChild(label);
      row.appendChild(spec);
      row.appendChild(inputWrap);
      row.appendChild(status);

      container.appendChild(row);
    });
  }

  function onAnswerChange(q, raw){
    let inSpec = null;
    let value = raw;

    if (q.type === 'boolean') {
      inSpec = (raw === 'OK');
    } else {
      const num = Number(raw);
      if (!raw || isNaN(num)) {
        inSpec = null;
      } else if (q.min != null && q.max != null) {
        inSpec = (num >= q.min && num <= q.max);
      } else if (q.min != null) {
        inSpec = (num >= q.min);
      } else if (q.max != null) {
        inSpec = (num <= q.max);
      }
      value = num;
    }

    answers[q.id] = {
      value,
      inSpec,
      factor: q.factor,
      label: q.label
    };

    const row = document.querySelector(`.ird-row[data-id="${q.id}"]`);
    if (!row) return;
    const status = row.querySelector('.ird-status');
    if (!status) return;

    if (inSpec === null) {
      status.textContent = 'Not evaluated';
      status.className = 'ird-status';
    } else if (inSpec) {
      status.textContent = 'Within spec';
      status.className = 'ird-status ok';
    } else {
      status.textContent = 'Out of spec';
      status.className = 'ird-status out';
    }

    updateSnapshot();
  }

  function updateSnapshot(){
    const snap = $('wizSnapshot');
    if (!snap) return;
    const lines = [];

    if (currentIssue) {
      lines.push(`<div class="mini-row">
        <span class="mini-label">Issue</span>
        <span class="mini-value">${currentIssue.toUpperCase()}</span>
      </div>`);
    }

    const outOfSpec = Object.values(answers).filter(a=>a.inSpec === false);
    if (outOfSpec.length) {
      lines.push(`<div class="mini-label" style="margin-top:4px">Out-of-spec signals:</div>`);
      outOfSpec.slice(0,4).forEach(a=>{
        lines.push(`<div class="mini-row">
          <span class="mini-label">${a.label}</span>
          <span class="mini-value">Out</span>
        </div>`);
      });
    }

    snap.innerHTML = lines.join('') || '<div class="mini-label">No data yet.</div>';
  }

  function buildDiagnosis(){
    const diag = $('diagSummary');
    if (!diag) return;

    const out = Object.values(answers).filter(a=>a.inSpec === false);
    if (!currentIssue) {
      diag.innerHTML = '<div class="diag-card">Please select an issue first.</div>';
      return;
    }
    if (!out.length) {
      diag.innerHTML = `
        <div class="diag-card">
          <strong>No clear out-of-spec signals detected.</strong>
          <div>From the IRD parameters you entered, everything looks within spec.<br>
          Focus next on coating formulation, substrate, and mechanical setup.</div>
        </div>`;
      return;
    }

    const byFactor = new Map();
    for (const a of out) {
      const key = a.factor || 'General';
      if (!byFactor.has(key)) byFactor.set(key, []);
      byFactor.get(key).push(a);
    }

    const cards = [];
    byFactor.forEach((arr, factor)=>{
      const items = arr.map(a=>`• ${a.label}`).join('<br>');
      cards.push(`
        <div class="diag-card">
          <strong>${factor}</strong>
          <div>${items}</div>
        </div>
      `);
    });

    cards.push(`
      <div class="diag-card">
        <strong>Next actions</strong>
        <div>
          Use this as a direction: address the highest-impact factors first (thermal / airflow),
          then run a short confirmation print. If symptoms persist, extend the analysis to coating,
          substrate and mechanical sections in the case form.
        </div>
      </div>
    `);

    diag.innerHTML = cards.join('');
  }

  function resetWizard() {
    currentStep = 1;
    currentIssue = null;
    answers = {};
    document.querySelectorAll('.issue-pill').forEach(btn=>btn.classList.remove('active'));
    buildIRDUI();
    setStep(1);
  }

  function attachEvents(){
    // issue pills
    document.querySelectorAll('.issue-pill').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        selectIssue(btn.dataset.issue);
        setStep(2);
      });
    });

    const btnNext = $('btnNextRCA');
    const btnPrev = $('btnPrevRCA');
    const btnRestart = $('btnRestartRCA');

    if (btnNext) btnNext.addEventListener('click', ()=>{
      if (currentStep === 1) {
        if (!currentIssue) {
          if (typeof toast === 'function') toast('Please select an issue first','err');
          return;
        }
        setStep(2);
      } else if (currentStep === 2) {
        setStep(3);
      } else {
        setStep(3);
      }
    });

    if (btnPrev) btnPrev.addEventListener('click', ()=>{
      if (currentStep === 3) setStep(2);
      else if (currentStep === 2) setStep(1);
    });

    if (btnRestart) btnRestart.addEventListener('click', resetWizard);
  }

  function initRCA(){
    if (!document.getElementById('rcaWizard')) return;
    buildIRDUI();
    attachEvents();
    setStep(1);
  }

  window.initRCA = initRCA;
})();
