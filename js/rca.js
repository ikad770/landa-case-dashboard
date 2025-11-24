// Root Cause Analyzer wizard logic

let wizState = {
  step: 1,
  issue: null,
  answers: {} // { questionId: { value, status } }
};

function initRCA(){
  // Avoid double-binding
  if(initRCA._initialized) return;
  initRCA._initialized = true;

  const issueButtons = document.querySelectorAll('.issue-pill');
  issueButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      issueButtons.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      wizState.issue = btn.dataset.issue;
      updateSnapshot();
    });
  });

  document.getElementById('btnNextRCA').addEventListener('click', nextStep);
  document.getElementById('btnPrevRCA').addEventListener('click', prevStep);
  document.getElementById('btnRestartRCA').addEventListener('click', restartRCA);

  renderStep();
  rebuildIRDQuestions();
}

function renderStep(){
  const step = wizState.step;
  const s1 = document.getElementById('wizStep1');
  const s2 = document.getElementById('wizStep2');
  const s3 = document.getElementById('wizStep3');

  s1.classList.toggle('hidden', step !== 1);
  s2.classList.toggle('hidden', step !== 2);
  s3.classList.toggle('hidden', step !== 3);

  // Stepper UI
  const steps = document.querySelectorAll('.wizard-step');
  steps.forEach(st=>{
    const n = Number(st.dataset.step);
    st.classList.toggle('active', n === step);
    st.classList.toggle('done',   n < step);
  });

  const track = document.getElementById('wizardTrack');
  if(track){
    const pct = (step-1) / 2 * 100;
    track.style.width = pct + '%';
  }

  // Buttons
  const btnPrev = document.getElementById('btnPrevRCA');
  const btnNext = document.getElementById('btnNextRCA');

  if(step === 1){
    btnPrev.disabled = true;
    btnNext.textContent = 'Next';
  } else if(step === 2){
    btnPrev.disabled = false;
    btnNext.textContent = 'Next';
  } else {
    btnPrev.disabled = false;
    btnNext.textContent = 'Finish';
  }

  updateSnapshot();
  if(step === 3) buildDiagnosis();
}

function nextStep(){
  if(wizState.step === 1){
    if(!wizState.issue){
      toast('Select an issue to continue','err');
      return;
    }
    // Only SetOff currently mapped to IRD
    if(wizState.issue !== 'setoff'){
      toast('Currently only SetOff is mapped to IRD wizard (others coming soon)','ok');
    }
  }
  if(wizState.step === 2){
    // validate minimal input? optional – we allow skipping
  }
  wizState.step = Math.min(3, wizState.step+1);
  renderStep();
}

function prevStep(){
  wizState.step = Math.max(1, wizState.step-1);
  renderStep();
}

function restartRCA(){
  wizState = { step:1, issue:null, answers:{} };
  document.querySelectorAll('.issue-pill').forEach(b=>b.classList.remove('active'));
  rebuildIRDQuestions();
  renderStep();
}

// Build IRD questions UI from RCA_DATA
function rebuildIRDQuestions(){
  const cont = document.getElementById('irdQuestions');
  if(!cont) return;
  cont.innerHTML='';

  const d = (window.RCA_DATA && window.RCA_DATA.setoff && window.RCA_DATA.setoff.irs)
    ? window.RCA_DATA.setoff.irs
    : null;
  if(!d){
    cont.innerHTML = '<div class="help">IRD data not configured.</div>';
    return;
  }

  d.questions.forEach(q=>{
    const row = document.createElement('div');
    row.className = 'ird-row';
    row.dataset.qid = q.id;

    const cellLabel = document.createElement('div');
    const l1 = document.createElement('div');
    l1.className = 'label';
    l1.textContent = q.label;
    cellLabel.appendChild(l1);
    if(q.tip){
      const l2 = document.createElement('div');
      l2.className = 'spec';
      l2.textContent = q.tip;
      cellLabel.appendChild(l2);
    } else if(q.prompt){
      const l2 = document.createElement('div');
      l2.className = 'spec';
      l2.textContent = q.prompt;
      cellLabel.appendChild(l2);
    }

    const cellInput = document.createElement('div');
    let input;
    if(q.type === 'range'){
      input = document.createElement('input');
      input.type = 'number';
      input.className = 'input v13';
      input.placeholder = 'Value';
      input.style.maxWidth='100%';
      input.addEventListener('input', ()=> onAnswerChange(q, input));
    } else {
      input = document.createElement('select');
      input.className='input v13';
      ['','OK','Not OK','N/A'].forEach(v=>{
        const o=document.createElement('option');
        o.value=v;
        o.textContent=v || 'Select…';
        input.appendChild(o);
      });
      input.addEventListener('change', ()=> onAnswerChange(q, input));
    }
    cellInput.appendChild(input);

    const cellSpec = document.createElement('div');
    cellSpec.className = 'spec';
    if(q.type === 'range' && typeof q.min === 'number' && typeof q.max === 'number'){
      cellSpec.textContent = `Spec: ${q.min}–${q.max} ${q.unit||''}`;
    } else {
      cellSpec.textContent = '';
    }

    const cellStatus = document.createElement('div');
    const badge = document.createElement('div');
    badge.className = 'badge-status warn';
    badge.textContent = '—';
    cellStatus.appendChild(badge);

    row.appendChild(cellLabel);
    row.appendChild(cellInput);
    row.appendChild(cellSpec);
    row.appendChild(cellStatus);
    cont.appendChild(row);
  });
}

function onAnswerChange(q, input){
  const id = q.id;
  let value = input.value;
  let status = 'unknown';

  if(q.type === 'range'){
    if(value === '' || isNaN(Number(value))){
      status = 'unknown';
    } else {
      const num = Number(value);
      if(typeof q.min === 'number' && typeof q.max === 'number'){
        if(num < q.min - 0.001) status = 'low';
        else if(num > q.max + 0.001) status = 'high';
        else status = 'ok';
      } else {
        status = 'ok';
      }
    }
  } else {
    if(!value) status = 'unknown';
    else if(value === 'OK') status='ok';
    else if(value === 'N/A') status='na';
    else status='bad';
  }

  wizState.answers[id] = { value, status };
  updateIRDRowStatus(id, status);
  updateSnapshot();
}

function updateIRDRowStatus(id, status){
  const row = document.querySelector(`.ird-row[data-qid="${id}"]`);
  if(!row) return;
  const badge = row.querySelector('.badge-status');
  if(!badge) return;

  badge.className = 'badge-status';
  if(status === 'ok'){
    badge.classList.add('ok');
    badge.textContent='Within spec';
  } else if(status === 'low'){
    badge.classList.add('bad');
    badge.textContent='Below spec';
  } else if(status === 'high'){
    badge.classList.add('bad');
    badge.textContent='Above spec';
  } else if(status === 'bad'){
    badge.classList.add('bad');
    badge.textContent='Problem';
  } else if(status === 'na'){
    badge.classList.add('warn');
    badge.textContent='N/A';
  } else {
    badge.classList.add('warn');
    badge.textContent='—';
  }
}

// Snapshot side panel
function updateSnapshot(){
  const box = document.getElementById('wizSnapshot');
  if(!box) return;
  const issue = wizState.issue;
  const step  = wizState.step;

  let issueLabel = 'Not selected';
  if(issue === 'setoff') issueLabel='SetOff';
  else if(issue === 'scratches') issueLabel='Scratches';
  else if(issue === 'uniformity') issueLabel='Uniformity';
  else if(issue === 'pq') issueLabel='PQ';

  const answered = Object.values(wizState.answers).filter(a=>a && a.value);
  box.innerHTML = `
    <div class="row"><span>Issue</span><span>${issueLabel}</span></div>
    <div class="row"><span>Step</span><span>${step} / 3</span></div>
    <div class="row"><span>Answered checks</span><span>${answered.length}</span></div>
  `;
}

// Diagnosis summary
function buildDiagnosis(){
  const cont = document.getElementById('diagSummary');
  if(!cont) return;
  const answers = wizState.answers;
  const bad = Object.entries(answers).filter(([_,a])=> a.status === 'bad' || a.status === 'low' || a.status === 'high');
  const ok  = Object.entries(answers).filter(([_,a])=> a.status === 'ok');

  let mainText;
  if(!Object.keys(answers).length){
    mainText = 'No parameters were filled. Please go back and provide at least a few key readings.';
  } else if(!bad.length){
    mainText = 'All provided parameters are within spec. Focus on non-IRD causes (coating, media, handling).';
  } else {
    mainText = 'Some IRD parameters are out of spec. Use the hints below as a starting point for your troubleshooting.';
  }

  cont.innerHTML = `
    <div class="diag-main">
      ${mainText}
    </div>
    <div>
      ${bad.map(([id,a])=> diagTag(id,a,'bad')).join('')}
      ${ok.slice(0,3).map(([id,a])=> diagTag(id,a,'ok')).join('')}
    </div>
    <div class="spec" style="margin-top:8px">
      This is a guidance tool only. Always validate the result with your own engineering judgment
      and Landa procedures.
    </div>
  `;
}

function diagTag(id, a, kind){
  const q = findQuestionById(id);
  if(!q) return '';
  const label = q.label || id;
  const statusText = (()=>{
    if(kind==='ok') return 'OK';
    if(a.status === 'low')  return 'Below spec';
    if(a.status === 'high') return 'Above spec';
    return 'Out of spec';
  })();
  return `
    <span class="diag-tag">
      <strong>${statusText}</strong> – ${esc(label)}
    </span>`;
}
function findQuestionById(id){
  const d = window.RCA_DATA && window.RCA_DATA.setoff && window.RCA_DATA.setoff.irs;
  if(!d) return null;
  return d.questions.find(q=>q.id === id) || null;
}

// expose
window.initRCA = initRCA;
