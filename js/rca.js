// RCA Wizard – simple step-by-step engine based on RCA_DATA

window.RCA = (function(){
  const hostId = 'rcaWizardHost';

  let currentIssue = null;
  let currentNodeId = null;
  let trail = []; // stack of node ids for Back

  function start(issueId){
    const data = window.RCA_DATA;
    if(!data || !data.issues || !data.issues[issueId]) return;

    currentIssue = data.issues[issueId];
    currentNodeId = currentIssue.entryNode;
    trail = [];
    render();
  }

  function goTo(nodeId){
    if(!nodeId){
      showMessage('No further steps defined for this path yet.');
      return;
    }
    if(currentNodeId) trail.push(currentNodeId);
    currentNodeId = nodeId;
    render();
  }

  function back(){
    if(!trail.length){
      reset();
      return;
    }
    currentNodeId = trail.pop();
    render();
  }

  function restart(){
    if(!currentIssue) return;
    currentNodeId = currentIssue.entryNode;
    trail = [];
    render();
  }

  function reset(){
    currentIssue = null;
    currentNodeId = null;
    trail = [];
    const host = document.getElementById(hostId);
    if(host) host.innerHTML = '';
  }

  function showMessage(msg){
    const host = document.getElementById(hostId);
    if(!host) return;
    host.innerHTML = `
      <div class="rca-step">
        <div class="rca-header">
          <div>
            <div class="title">Root Cause Wizard</div>
            <div class="help">${msg}</div>
          </div>
        </div>
        <div class="rca-actions" style="margin-top:10px">
          <button class="btn small" type="button" onclick="RCA.restart()">Restart</button>
        </div>
      </div>
    `;
  }

  function render(){
    const host = document.getElementById(hostId);
    if(!host) return;

    if(!currentIssue || !currentNodeId){
      host.innerHTML = '';
      return;
    }

    const data = window.RCA_DATA;
    const node = data.nodes[currentNodeId];
    if(!node){
      showMessage('No data defined for this node yet.');
      return;
    }

    // progress dots – very simple (depth based on trail length)
    const depth = trail.length + 1;
    const dots = [];
    for(let i=0;i<Math.max(depth,3);i++){
      const cls = i===depth-1 ? 'rca-dot active' : 'rca-dot';
      dots.push(`<span class="${cls}"></span>`);
    }

    if(node.type === 'question'){
      host.innerHTML = `
        <div class="rca-step">
          <div class="rca-header">
            <div>
              <div class="title">${currentIssue.label} – Wizard</div>
              <div class="help">${node.text}</div>
            </div>
            <div class="rca-progress">${dots.join('')}</div>
          </div>
          <div class="rca-actions" style="margin-top:12px">
            ${node.options.map(o=>`
              <button class="btn small" type="button"
                      onclick="RCA._select('${o.next||''}')">
                ${o.label}
              </button>`).join('')}
          </div>
          <div class="rca-actions" style="margin-top:10px">
            <button class="btn small ghost" type="button" onclick="RCA.back()">Back</button>
            <button class="btn small ghost" type="button" onclick="RCA.restart()">Restart</button>
          </div>
        </div>
      `;
    }else if(node.type === 'diagnosis'){
      host.innerHTML = `
        <div class="rca-step">
          <div class="rca-header">
            <div>
              <div class="title">${node.title}</div>
              <div class="help">${node.summary}</div>
            </div>
            <div class="rca-progress">${dots.join('')}</div>
          </div>
          <div style="margin-top:10px">
            <ul class="stat-list">
              ${(node.actions||[]).map(a=>`
                <li><span class="stat-label">${a}</span></li>`).join('')}
            </ul>
          </div>
          <div class="rca-actions" style="margin-top:10px">
            <button class="btn small" type="button" onclick="RCA.restart()">Restart same issue</button>
            <button class="btn small ghost" type="button" onclick="RCA.reset()">Close wizard</button>
          </div>
        </div>
      `;
    }else{
      showMessage('Unsupported node type.');
    }
  }

  return {
    start,
    back,
    restart,
    reset,
    _select: goTo
  };
})();
