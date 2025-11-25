/* ===================================================================
   Landa Quantum – Fishbone Troubleshooter (V20.1 • Multi-Issue)
   - Loads tree from RCA_DATA[issue] (data/rca-data.js)
   - Updated to work with the new RCA Launcher logic in js/rca.js
=================================================================== */
(function(){
  if (window.__LANDA_FISHBONE__) return; window.__LANDA_FISHBONE__ = true;
  const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const RCA_DATA = window.RCA_DATA;
  const ACTIVE = window.__RCA_ACTIVE_STATE__ || { issue: 'setoff', branch: null, currentStep: 0, answers: {} };

  // Helper for creating elements
  const h=(t,a={},c=[])=>{ const e=document.createElement(t);
    for(const [k,v] of Object.entries(a||{})){
      if(k==='class') e.className=v; else if(k==='text') e.textContent=v; else if(k==='style') e.setAttribute('style',v);
      else if(k.startsWith('on') && typeof v==='function') e.addEventListener(k.slice(2), v); else e.setAttribute(k,v);
    }
    (Array.isArray(c)?c:[c]).forEach(n=>{ if(n==null)return; typeof n==='string'?e.appendChild(document.createTextNode(n)):e.appendChild(n); });
    return e;
  };

  // --- Core UI Renderer ---

  function build(host, issueId){
    const issueKey = issueId.toLowerCase();
    const data = RCA_DATA[issueKey] || RCA_DATA['setoff']; // Fallback to setoff
    
    // איפוס מצב ה-Fishbone
    ACTIVE.issue = issueKey;
    ACTIVE.branch = null;
    ACTIVE.currentStep = 0;
    ACTIVE.answers = {};
    
    const root = h('div',{id:'fbRoot'});
    host.innerHTML = '';
    host.appendChild(root);

    function renderTriage(){
      const currentStepData = data.triage[ACTIVE.currentStep];
      if (!currentStepData) {
        return renderSubsystems(); // עובר למסך המערכות
      }
      
      root.innerHTML = '';

      const progress = h('div',{class:'progress'}, data.triage.map((_, i) => 
        h('div', { class: 'progress-step' + (i <= ACTIVE.currentStep ? ' active' : '') })
      ));

      root.appendChild(progress);
      
      const stepContent = h('div',{class:'step-content'});
      
      // Title
      stepContent.appendChild(h('h3', { text: `${ACTIVE.currentStep + 1}. ${currentStepData.label}` }));
      if (currentStepData.help) {
          stepContent.appendChild(h('p', { class: 'help', text: currentStepData.help }));
      }
      
      // Choices
      const choices = h('div', { class: 'subsystem-list' });
      currentStepData.options.forEach(option => {
        const btn = h('button', {
          class: 'btn primary',
          text: option.label,
          onclick: () => handleTriageAnswer(option.value)
        });
        choices.appendChild(h('div', { class: 'subsystem-card' }, [btn]));
      });
      stepContent.appendChild(choices);
      
      root.appendChild(stepContent);

      // Footer
      const footer = h('div', { class: 'rca-modal-footer' }, [
          h('div', { class: 'rca-footer-left' }, [
              ACTIVE.currentStep > 0 ? h('button', { class: 'btn', text: '← Back', onclick: goBackTriage }) : null
          ]),
          h('div', { class: 'rca-footer-right' }, [
              h('button', { class: 'btn danger small', text: 'Restart Wizard', onclick: ()=>window.injectRcaLauncher() })
          ])
      ]);
      root.appendChild(footer);
    }
    
    function goBackTriage(){
        ACTIVE.currentStep--;
        renderTriage();
    }

    function handleTriageAnswer(answer) {
        // שמירת תשובה לשלב הנוכחי
        ACTIVE.answers[data.triage[ACTIVE.currentStep].id] = answer;
        
        // בדיקה אם זה השלב האחרון
        if (ACTIVE.currentStep < data.triage.length - 1) {
            ACTIVE.currentStep++;
            renderTriage();
        } else {
            // החלטת ה-Branch הסופי (אם יש)
            const finalAnswer = ACTIVE.answers[data.triage[data.triage.length - 1].id];
            ACTIVE.branch = data.triageBranch[finalAnswer];
            renderSubsystems();
        }
    }


    function renderSubsystems(){
        root.innerHTML = '';
        const relevantSubsystems = ACTIVE.branch || Object.keys(data.subsystems); // אם אין Triage, מציג את כולם
        
        root.appendChild(h('h2', { text: `2. Select Suspected Subsystem for ${data.title}` }));
        root.appendChild(h('p', { class: 'help', text: 'Based on the triage, focus your diagnostics on the following subsystems.' }));

        const list = h('div',{class:'subsystem-list'});
        
        relevantSubsystems.forEach(subId => {
            const sub = data.subsystems[subId];
            if (!sub) return;

            const card = h('div', {
                class: 'subsystem-card',
                onclick: () => openSubsystemModal(subId)
            }, [
                h('div', { class: 'title', text: sub.title }),
                h('div', { class: 'rca-note', text: sub.description }),
                h('div', { class: 'rca-note', text: `Mechanism: ${sub.mechanism}` }),
            ]);
            list.appendChild(card);
        });
        
        root.appendChild(list);

        // Footer
        const footer = h('div', { class: 'rca-modal-footer' }, [
            h('div', { class: 'rca-footer-left' }, [
                data.triage.length > 0 ? h('button', { class: 'btn', text: '← Back to Triage', onclick: ()=>renderTriage() }) : null
            ]),
            h('div', { class: 'rca-footer-right' }, [
                h('button', { class: 'btn danger small', text: 'Restart Wizard', onclick: ()=>window.injectRcaLauncher() })
            ])
        ]);
        root.appendChild(footer);
    }
    
    // --- Subsystem Modal Logic ---

    function openSubsystemModal(subId) {
      const sub = data.subsystems[subId];
      if (!sub) return;

      const modalBack = h('div', { id: 'modalBack' });
      const modal = h('div', { class: 'modal-content', style: 'max-width: 700px' });
      
      const results = ACTIVE.answers[subId] || {}; // טעינת תשובות קודמות
      
      function renderModalContent() {
          const body = h('div', { class: 'modal-body', style: 'padding:15px 20px' });
          const checksList = h('div', { class: 'checks-list', style: 'margin-top:15px' });
          
          sub.checks.forEach(check => {
              const checkId = `${subId}_${check.id}`;
              const checkWrap = h('div', { class: 'panel', style: 'padding:12px; margin-bottom:10px' });
              checkWrap.appendChild(h('div', { class: 'title', text: check.label }));
              if (check.spec) checkWrap.appendChild(h('div', { class: 'meta', text: `Spec: ${check.spec} ${check.unit||''}` }));
              
              const currentResult = results[check.id] || { status: check.type === 'choice' ? '' : '', value: '' };

              if (check.type === 'choice') {
                  const toggleRow = h('div', { class: 'rca-toggle-row' });
                  check.options.forEach(opt => {
                      const isActive = currentResult.value === opt.value;
                      const badgeClass = opt.value === 'ok' ? 'rca-badge-ok' : (opt.value === 'bad' ? 'rca-badge-bad' : 'rca-badge-warn');
                      
                      const btn = h('button', {
                          class: `btn small rca-badge ${badgeClass}`,
                          text: opt.label,
                          onclick: () => { 
                              results[check.id] = { status: opt.value, value: opt.value };
                              renderModalContent(); 
                          }
                      });
                      if (isActive) btn.style.boxShadow = '0 0 0 2px var(--accent)';
                      toggleRow.appendChild(btn);
                  });
                  checkWrap.appendChild(toggleRow);
              } else if (check.type === 'text') {
                  const input = h('input', {
                      class: 'input',
                      type: 'text',
                      value: currentResult.value,
                      placeholder: `Enter measured value (${check.unit||''})`,
                      onchange: (e) => {
                          let status = 'warn'; 
                          const val = e.target.value.trim();
                          // Simplified spec check: if spec is a range (e.g., 110-120)
                          const spec = check.spec.split('-');
                          const numVal = parseFloat(val);

                          if (spec.length === 2 && !isNaN(numVal)) {
                              const min = parseFloat(spec[0]);
                              const max = parseFloat(spec[1]);
                              if (numVal >= min && numVal <= max) status = 'ok';
                              else status = 'bad';
                          } else if (val) {
                              status = 'ok'; // Assume OK if value is entered and no strict spec check
                          } else {
                              status = 'warn'; // Warn if empty
                          }
                          
                          results[check.id] = { status: status, value: val };
                          // No need to re-render, just update the state. The final review will use the state.
                      }
                  });
                  checkWrap.appendChild(input);
              }
              checksList.appendChild(checkWrap);
          });
          
          body.appendChild(checksList);
          
          // Clear and re-append body content
          const existingBody = qs('.modal-body', modal);
          if (existingBody) existingBody.replaceWith(body);
          else modal.appendChild(body);
      }

      function closeAndSave() {
          ACTIVE.answers[subId] = results; // שמירת התשובות
          modalBack.remove();
          renderSubsystems(); // רנדור מחדש להצגת סטטוס מעודכן (אם היה)
      }
      
      const header = h('div', { class: 'modal-header' }, [
        h('h3', { text: sub.title }),
        h('div', { class: 'rca-note', text: `Mechanism: ${sub.mechanism}` })
      ]);
      
      const footer = h('div', { class: 'modal-footer' }, [
        h('button', { class: 'btn primary', text: 'Save & Close', onclick: closeAndSave }),
        h('button', { class: 'btn', text: 'Cancel', onclick: () => modalBack.remove() })
      ]);

      modal.appendChild(header);
      renderModalContent(); // רנדור תוכן ראשוני
      modal.appendChild(footer);
      modalBack.appendChild(modal);

      document.body.appendChild(modalBack);

      // סגירה בלחיצה על רקע המודאל
      modalBack.addEventListener('click', (e) => {
          if (e.target.id === 'modalBack') {
              closeAndSave();
          }
      });
    }

    // --- Entry Point ---
    renderTriage();
  }
  
  // הפונקציה הגלובלית שנקראת מ-js/rca.js
  window.initFishbone = function(issueId){
    const host=document.getElementById('fbHost'); 
    if(!host) return; 
    build(host, issueId);
  };
})();
