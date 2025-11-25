// js/cases.js
// Rendering and interactions for "All Cases" page

(function () {
  const pageId = "page-cases";

  function buildPageShell() {
    const page = document.getElementById(pageId);
    if (!page) return;
    page.innerHTML = `
      <div class="page-header">
        <div>
          <h2>All Cases</h2>
          <p>Full list of all troubleshooting cases with filters and quick actions.</p>
        </div>
      </div>

      <div class="panel">
        <div class="filter-bar">
          <input class="input" id="casesSearch" placeholder="Search in SF Case, Subject, Customer, System">
          <div id="dd-filter-status" class="dd" style="max-width:140px"></div>
          <div id="dd-filter-severity" class="dd" style="max-width:140px"></div>
          <div id="dd-filter-system" class="dd" style="max-width:180px"></div>
          <div id="dd-filter-hwsw" class="dd" style="max-width:130px"></div>
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
                <th>Date</th>
                <th>Customer</th>
                <th>Press</th>
                <th>System</th>
                <th>Severity</th>
                <th>Status</th>
                <th>HW/SW</th>
                <th>Owner</th>
                <th></th>
              </tr>
            </thead>
            <tbody><!-- filled dynamically --></tbody>
          </table>
        </div>
      </div>
    `;
  }

  let ddFilterStatus, ddFilterSeverity, ddFilterSystem, ddFilterHwSw;
  let currentFilters = {
    search: "",
    status: "",
    severity: "",
    system: "",
    hwSw: "",
    dateFrom: "",
    dateTo: "",
    quarter: ""
  };

  function applyPendingDashboardFilter() {
    if (window.pendingCasesFilter) {
      const { field, value } = window.pendingCasesFilter;
      if (field === "system") currentFilters.system = value;
      if (field === "customer") currentFilters.search = value;
      if (field === "hwSw") currentFilters.hwSw = value;
      if (field === "swVersion") currentFilters.search = value;
      if (field === "quarter") currentFilters.quarter = value;
      window.pendingCasesFilter = null;
    }
  }

  function setupFilters() {
    const statusEl = document.getElementById("dd-filter-status");
    const sevEl = document.getElementById("dd-filter-severity");
    const sysEl = document.getElementById("dd-filter-system");
    const hwEl = document.getElementById("dd-filter-hwsw");

    ddFilterStatus = window.makeDropdown
      ? window.makeDropdown(statusEl, {
          placeholder: "Status",
          options: [
            { value: "", label: "All statuses" },
            { value: "Open", label: "Open" },
            { value: "In Progress", label: "In Progress" },
            { value: "Monitoring", label: "Monitoring" },
            { value: "Closed", label: "Closed" }
          ],
          onChange: (v) => {
            currentFilters.status = v;
            renderTable();
          }
        })
      : null;

    ddFilterSeverity = window.makeDropdown
      ? window.makeDropdown(sevEl, {
          placeholder: "Severity",
          options: [
            { value: "", label: "All severities" },
            { value: "Critical", label: "Critical" },
            { value: "High", label: "High" },
            { value: "Medium", label: "Medium" },
            { value: "Low", label: "Low" }
          ],
          onChange: (v) => {
            currentFilters.severity = v;
            renderTable();
          }
        })
      : null;

    ddFilterSystem = window.makeDropdown
      ? window.makeDropdown(sysEl, {
          placeholder: "System",
          options: [
            { value: "", label: "All systems" },
            { value: "Print Engine", label: "Print Engine" },
            { value: "Feeder", label: "Feeder" },
            { value: "Coater", label: "Coater" },
            { value: "Dryer", label: "Dryer" },
            { value: "ICS", label: "ICS" },
            { value: "IRD", label: "IRD" },
            { value: "STS", label: "STS" },
            { value: "Other", label: "Other" }
          ],
          onChange: (v) => {
            currentFilters.system = v;
            renderTable();
          }
        })
      : null;

    ddFilterHwSw = window.makeDropdown
      ? window.makeDropdown(hwEl, {
          placeholder: "HW/SW",
          options: [
            { value: "", label: "All types" },
            { value: "HW", label: "Hardware" },
            { value: "SW", label: "Software" },
            { value: "Mixed", label: "HW + SW" }
          ],
          onChange: (v) => {
            currentFilters.hwSw = v;
            renderTable();
          }
        })
      : null;

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
      currentFilters = {
        search: "",
        status: "",
        severity: "",
        system: "",
        hwSw: "",
        dateFrom: "",
        dateTo: "",
        quarter: ""
      };
      searchInput.value = "";
      dateFrom.value = "";
      dateTo.value = "";
      ddFilterStatus && ddFilterStatus.setValue("");
      ddFilterSeverity && ddFilterSeverity.setValue("");
      ddFilterSystem && ddFilterSystem.setValue("");
      ddFilterHwSw && ddFilterHwSw.setValue("");
      renderTable();
    });
  }

  function passQuarterFilter(c) {
    if (!currentFilters.quarter) return true;
    const d = c.createdAt || "";
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
    if (currentFilters.status) pieces.push(`<span class="filter-pill"><b>Status:</b> ${esc(currentFilters.status)}</span>`);
    if (currentFilters.severity) pieces.push(`<span class="filter-pill"><b>Severity:</b> ${esc(currentFilters.severity)}</span>`);
    if (currentFilters.system) pieces.push(`<span class="filter-pill"><b>System:</b> ${esc(currentFilters.system)}</span>`);
    if (currentFilters.hwSw) pieces.push(`<span class="filter-pill"><b>Type:</b> ${esc(currentFilters.hwSw)}</span>`);
    if (currentFilters.dateFrom || currentFilters.dateTo) {
      pieces.push(`<span class="filter-pill"><b>Date:</b> ${esc(currentFilters.dateFrom || "…")} → ${esc(currentFilters.dateTo || "…")}</span>`);
    }
    if (currentFilters.quarter) {
      pieces.push(`<span class="filter-pill"><b>Quarter:</b> ${esc(currentFilters.quarter)}</span>`);
    }
    el.innerHTML = pieces.join(" ");
  }

  function esc(s) {
    return (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  }

  function renderTable() {
    const tbody = document.querySelector("#casesTable tbody");
    if (!tbody) return;
    const cases = window.getCases ? window.getCases() : [];
    const rows = cases.filter(c => {
      if (currentFilters.status && c.status !== currentFilters.status) return false;
      if (currentFilters.severity && c.severity !== currentFilters.severity) return false;
      if (currentFilters.system && c.system !== currentFilters.system) return false;
      if (currentFilters.hwSw && c.hwSw !== currentFilters.hwSw) return false;
      if (currentFilters.dateFrom && (c.createdAt || "") < currentFilters.dateFrom) return false;
      if (currentFilters.dateTo && (c.createdAt || "") > currentFilters.dateTo) return false;
      if (!passQuarterFilter(c)) return false;
      if (currentFilters.search) {
        const txt = (
          (c.sfCase || "") + " " +
          (c.subject || "") + " " +
          (c.customer || "") + " " +
          (c.system || "") + " " +
          (c.swVersion || "")
        ).toLowerCase();
        if (!txt.includes(currentFilters.search)) return false;
      }
      return true;
    });

    rows.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    tbody.innerHTML = "";
    if (!rows.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="10" style="text-align:center; color:var(--muted); padding:10px;">No cases found for current filters.</td>`;
      tbody.appendChild(tr);
      renderActiveFilterSummary();
      return;
    }

    rows.forEach(c => {
      const tr = document.createElement("tr");
      const statusClass = (c.status || "").replace(" ", "\\ ");
      tr.innerHTML = `
        <td class="case-id-cell">${esc(c.sfCase || "")}</td>
        <td>${esc(c.createdAt || "")}</td>
        <td>${esc(c.customer || "")}</td>
        <td>${esc(c.press || "")}</td>
        <td>${esc(c.system || "")}</td>
        <td>${esc(c.severity || "")}</td>
        <td><span class="badge-status ${esc(statusClass)}">${esc(c.status || "") || "—"}</span></td>
        <td>${esc(c.hwSw || "")}</td>
        <td>${esc(c.owner || "")}</td>
        <td>
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

    renderActiveFilterSummary();
  }

  window.renderAllCases = function () {
    buildPageShell();
    applyPendingDashboardFilter();
    setupFilters();
    renderTable();
  };
})();
