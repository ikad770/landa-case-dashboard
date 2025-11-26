// js/cases.js – All Cases table + details modal

(function () {
  const pageId = "page-cases";

  function esc(s) {
    return (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  }

  function buildPageShell() {
    const page = document.getElementById(pageId);
    if (!page) return;
    page.innerHTML = `
      <div class="page-header">
        <div>
          <h2>All Cases</h2>
          <p>Full list of cases with quick filters and deep dive.</p>
        </div>
      </div>

      <div class="panel">
        <div class="filter-bar">
          <input class="input" id="casesSearch" placeholder="Search in SF Case, Subject, Customer, System">
          <input class="input" id="casesDateFrom" type="date" style="max-width:130px" title="From date">
          <input class="input" id="casesDateTo" type="date" style="max-width:130px" title="To date">
          <button class="btn small" id="btnCasesClearFilters">Clear</button>
        </div>
        <div class="filter-active" id="casesActiveFilter"></div>
        <div class="table-wrap">
          <table class="table" id="casesTable">
            <thead>
              <tr>
                <th>SF Case</th>
                <th>Case Date</th>
                <th>Press</th>
                <th>Customer</th>
                <th>System</th>
                <th>Subject</th>
                <th>Status</th>
                <th>HW/SW</th>
                <th></th>
              </tr>
            </thead>
            <tbody><!-- rows --></tbody>
          </table>
        </div>
      </div>
    `;
  }

  let currentFilters = {
    search: "",
    dateFrom: "",
    dateTo: "",
    quarter: ""
  };

  function applyPendingDashboardFilter() {
    if (window.pendingCasesFilter) {
      const { field, value } = window.pendingCasesFilter;
      if (field === "system") currentFilters.search = value;
      if (field === "customer") currentFilters.search = value;
      if (field === "hwSw") currentFilters.search = value;
      if (field === "swVersion") currentFilters.search = value;
      if (field === "quarter") currentFilters.quarter = value;
      window.pendingCasesFilter = null;
    }
  }

  function passQuarterFilter(c) {
    if (!currentFilters.quarter) return true;
    const d = c.caseDate || "";
    if (!d || d.length < 7) return false;
    const year = d.slice(0, 4);
    const month = parseInt(d.slice(5, 7), 10);
    if (!month) return false;
    const q = "Q" + (Math.floor((month - 1) / 3) + 1);
    const k = `${year}-${q}`;
    return k === currentFilters.quarter;
  }

  function renderActiveFilterSummary() {
    const el = document.getElementById("casesActiveFilter");
    if (!el) return;
    const pieces = [];
    if (currentFilters.search) pieces.push(`<span class="filter-pill"><b>Search:</b> ${esc(currentFilters.search)}</span>`);
    if (currentFilters.dateFrom || currentFilters.dateTo) {
      pieces.push(`<span class="filter-pill"><b>Date:</b> ${esc(currentFilters.dateFrom || "…")} → ${esc(currentFilters.dateTo || "…")}</span>`);
    }
    if (currentFilters.quarter) {
      pieces.push(`<span class="filter-pill"><b>Quarter:</b> ${esc(currentFilters.quarter)}</span>`);
    }
    el.innerHTML = pieces.join(" ");
  }

  function setupFilters() {
    const searchInput = document.getElementById("casesSearch");
    const dateFrom = document.getElementById("casesDateFrom");
    const dateTo = document.getElementById("casesDateTo");

    searchInput.addEventListener("input", () => {
      currentFilters.search = searchInput.value.toLowerCase();
      renderTable();
    });
    dateFrom.addEventListener("change", () => {
      currentFilters.dateFrom = dateFrom.value;
      renderTable();
    });
    dateTo.addEventListener("change", () => {
      currentFilters.dateTo = dateTo.value;
      renderTable();
    });

    document.getElementById("btnCasesClearFilters").addEventListener("click", () => {
      currentFilters = { search: "", dateFrom: "", dateTo: "", quarter: "" };
      searchInput.value = "";
      dateFrom.value = "";
      dateTo.value = "";
      renderTable();
    });
  }

  function passesFilters(c) {
    if (currentFilters.dateFrom && (c.caseDate || "") < currentFilters.dateFrom) return false;
    if (currentFilters.dateTo && (c.caseDate || "") > currentFilters.dateTo) return false;
    if (!passQuarterFilter(c)) return false;
    if (currentFilters.search) {
      const txt = (
        (c.sfCase || "") + " " +
        (c.subject || "") + " " +
        (c.customer || "") + " " +
        (c.system || "") + " " +
        (c.swVersion || "") + " " +
        (c.press || "")
      ).toLowerCase();
      if (!txt.includes(currentFilters.search)) return false;
    }
    return true;
  }

  function renderTable() {
    const tbody = document.querySelector("#casesTable tbody");
    if (!tbody) return;
    const cases = window.getCases ? window.getCases() : [];
    const rows = cases.filter(passesFilters);

    rows.sort((a, b) => (b.caseDate || "").localeCompare(a.caseDate || ""));

    tbody.innerHTML = "";
    if (!rows.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="9" style="text-align:center; color:var(--muted); padding:10px;">No cases found for current filters.</td>`;
      tbody.appendChild(tr);
      renderActiveFilterSummary();
      return;
    }

    rows.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="case-id-cell">${esc(c.sfCase || "")}</td>
        <td>${esc(c.caseDate || "")}</td>
        <td>${esc(c.press || "")}</td>
        <td>${esc(c.customer || "")}</td>
        <td>${esc(c.system || "")}</td>
        <td>${esc(c.subject || "")}</td>
        <td>${esc(c.status || "")}</td>
        <td>${esc(c.hwSw || "")}</td>
        <td>
          <button class="btn small" data-action="view" data-id="${c.id}">View</button>
          <button class="btn small" data-action="edit" data-id="${c.id}">Edit</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll("button[data-action='edit']").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        if (window.editCaseFromList) window.editCaseFromList(id);
      });
    });
    tbody.querySelectorAll("button[data-action='view']").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        const c = window.getCaseById ? window.getCaseById(id) : null;
        if (c) showCaseModal(c);
      });
    });

    renderActiveFilterSummary();
  }

  function showCaseModal(c) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    const modal = document.createElement("div");
    modal.className = "modal";

    const troubleshooting = (c.troubleshooting || []).filter(x => x && x.trim());
    const attachments = c.attachments || [];

    modal.innerHTML = `
      <div class="modal-header">
        <div>
          <h3>Case ${esc(c.sfCase || "")}</h3>
          <div class="meta">
            ${esc(c.press || "")} · ${esc(c.customer || "")} · ${esc(c.system || "")}${c.subsystem ? " / " + esc(c.subsystem) : ""}<br>
            Date: ${esc(c.caseDate || "—")} · Status: ${esc(c.status || "—")}
          </div>
        </div>
        <button class="modal-close" aria-label="Close">×</button>
      </div>

      <div class="modal-grid">
        <div>
          <div class="modal-block-title">Problem</div>
          <div class="modal-kv"><span>Subject:</span><span>${esc(c.subject || "")}</span></div>
          <div class="modal-kv"><span>Description:</span></div>
          <div class="modal-kv" style="white-space:pre-wrap">${esc(c.description || "")}</div>

          <div class="modal-block-title" style="margin-top:8px;">Troubleshooting</div>
          ${troubleshooting.length ? `
            <ul style="font-size:12px; margin:4px 0 0 16px;">
              ${troubleshooting.map(t => `<li>${esc(t)}</li>`).join("")}
            </ul>
          ` : `<div class="modal-kv"><span>No documented steps.</span></div>`}
        </div>

        <div>
          <div class="modal-block-title">Technical</div>
          <div class="modal-kv"><span>Press Type:</span><span>${esc(c.pressType || "")}</span></div>
          <div class="modal-kv"><span>SW Version:</span><span>${esc(c.swVersion || "")}</span></div>
          <div class="modal-kv"><span>HW/SW:</span><span>${esc(c.hwSw || "")}</span></div>
          <div class="modal-kv"><span>Part:</span><span>${esc(c.hwPart || "")}</span></div>
          <div class="modal-kv"><span>Region:</span><span>${esc(c.region || "")}</span></div>
          <div class="modal-kv"><span>Owner:</span><span>${esc(c.owner || "")}</span></div>
          <div class="modal-kv"><span>Tags:</span><span>${esc(c.tags || "")}</span></div>

          <div class="modal-block-title" style="margin-top:8px;">Attachments</div>
          ${attachments.length ? `
            <div style="display:flex; flex-direction:column; gap:4px; margin-top:4px;">
              ${attachments.map((a, idx) => `
                <div class="modal-kv">
                  <span>${idx+1}.</span>
                  <span>${esc(a)}</span>
                  <button class="btn small" data-act="preview" data-idx="${idx}">Preview</button>
                  <button class="btn small" data-act="download" data-idx="${idx}">Download</button>
                </div>
              `).join("")}
            </div>
          ` : `<div class="modal-kv"><span>No attachments.</span></div>`}

          <div class="modal-block-title" style="margin-top:8px;">Notes</div>
          <div class="modal-kv" style="white-space:pre-wrap">${esc(c.notes || "")}</div>
        </div>
      </div>
    `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    function close() {
      backdrop.remove();
    }
    backdrop.addEventListener("click", e => {
      if (e.target === backdrop) close();
    });
    modal.querySelector(".modal-close")?.addEventListener("click", close);

    modal.querySelectorAll("button[data-act='preview']").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.idx);
        const val = attachments[idx];
        if (!val) return;
        if (/^https?:\/\//i.test(val)) window.open(val, "_blank");
        else alert("Attachment: " + val);
      });
    });
    modal.querySelectorAll("button[data-act='download']").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.idx);
        const val = attachments[idx];
        if (!val) return;
        if (/^https?:\/\//i.test(val)) {
          const a = document.createElement("a");
          a.href = val;
          a.download = "";
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else {
          alert("Download not available – not a URL.\n" + val);
        }
      });
    });
  }

  window.renderAllCases = function () {
    buildPageShell();
    applyPendingDashboardFilter();
    setupFilters();
    renderTable();
  };
})();
