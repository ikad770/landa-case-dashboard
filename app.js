/* ========= Helpers ========= */
function toast(msg, type = "ok") {
  const wrap = document.getElementById("toasts");
  if (!wrap) return;
  const t = document.createElement("div");
  t.className = "toast " + type;
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 260);
  }, 1600);
}
function esc(s) {
  return (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
}
const LS_KEY_CASES = "landa_cases_v19";
const LS_KEY_AUTH  = "landaAuth_v19";
const LS_KEY_THEME = "landaTheme_v19";
const LS_KEY_DENS  = "landaDensity_v19";

/* ========= Storage ========= */
function getCases() {
  try { return JSON.parse(localStorage.getItem(LS_KEY_CASES) || "[]"); }
  catch (e) { return []; }
}
function setCases(arr) {
  localStorage.setItem(LS_KEY_CASES, JSON.stringify(arr));
  updateKPIs();
  const countEl = document.getElementById("casesCount");
  if (countEl) countEl.textContent = arr.length;
}
function upsertCase(caseObj) {
  const cases = getCases();
  const idx = cases.findIndex(c => c.id === caseObj.id);
  if (idx >= 0) cases[idx] = caseObj; else cases.push(caseObj);
  setCases(cases);
}
function getCaseById(id) {
  return getCases().find(c => c.id === id);
}

/* ========= Routing ========= */
const pages = ["dashboard", "create", "cases", "diagnosis", "settings"];

function go(route) {
  pages.forEach(p => {
    const el = document.getElementById("page-" + p);
    if (el) el.classList.add("hidden");
  });
  const tgt = document.getElementById("page-" + route);
  if (tgt) tgt.classList.remove("hidden");
  document.querySelectorAll(".nav .item").forEach(a => {
    const r = a.getAttribute("data-route");
    a.classList.toggle("active", r === route);
  });

  if (route === "dashboard") updateKPIs();
  if (route === "cases" && typeof window.renderAllCases === "function") {
    window.renderAllCases();
  }
  if (route === "diagnosis" && typeof window.renderRCA === "function") {
    window.renderRCA();
  }

  if (document.body.classList.contains("aside-open"))
    document.body.classList.remove("aside-open");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("logoHome")?.addEventListener("click", () => go("dashboard"));
document.querySelectorAll(".nav .item").forEach(a => {
  const r = a.getAttribute("data-route");
  if (r) {
    a.addEventListener("click", e => {
      e.preventDefault();
      go(r);
    });
  }
});
document.getElementById("btnMenu")?.addEventListener("click", () => {
  document.body.classList.toggle("aside-open");
});

/* ========= Auth ========= */
const loginPage = document.getElementById("loginPage");
const appRoot   = document.getElementById("appRoot");
const authUser  = document.getElementById("authUser");
const authPass  = document.getElementById("authPass");

function showApp() {
  loginPage.classList.add("hidden");
  appRoot.classList.remove("hidden");
  go("dashboard");
  updateKPIs();
}
function showLogin() {
  appRoot.classList.add("hidden");
  loginPage.classList.remove("hidden");
}

function attemptLogin() {
  const u = (authUser?.value || "").trim();
  const p = (authPass?.value || "").trim();
  if (u === "Expert" && p === "Landa123456") {
    toast("Welcome, Expert", "ok");
    localStorage.setItem(LS_KEY_AUTH, "true");
    setTimeout(showApp, 550);
  } else {
    toast("Invalid credentials", "err");
  }
}
document.getElementById("btnLogin")?.addEventListener("click", attemptLogin);
[authUser, authPass].forEach(el => {
  el?.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      attemptLogin();
    }
  });
});
document.getElementById("btnLogout")?.addEventListener("click", e => {
  e.preventDefault();
  toast("Logged out", "ok");
  localStorage.removeItem(LS_KEY_AUTH);
  setTimeout(showLogin, 400);
});

if (localStorage.getItem(LS_KEY_AUTH) === "true") {
  showApp();
}

/* ========= Theme & Density ========= */
function applyThemeFromStorage() {
  const t = localStorage.getItem(LS_KEY_THEME) || "dark";
  if (t === "light") document.body.classList.add("light");
  else document.body.classList.remove("light");
}
function toggleTheme() {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem(LS_KEY_THEME, isLight ? "light" : "dark");
}
document.getElementById("btnToggleTheme")?.addEventListener("click", toggleTheme);

function applyDensityFromStorage() {
  const d = localStorage.getItem(LS_KEY_DENS) || "normal";
  if (d === "compact") document.body.classList.add("compact");
  else document.body.classList.remove("compact");
}
function toggleDensity() {
  const isCompact = document.body.classList.toggle("compact");
  localStorage.setItem(LS_KEY_DENS, isCompact ? "compact" : "normal");
}
document.getElementById("btnToggleDensity")?.addEventListener("click", toggleDensity);

applyThemeFromStorage();
applyDensityFromStorage();

/* ========= Particles Background ========= */
(function () {
  const c = document.getElementById("particles");
  if (!c) return;
  const ctx = c.getContext("2d");
  let w = window.innerWidth, h = window.innerHeight;
  c.width = w; c.height = h;
  const ps = [];
  for (let i = 0; i < 60; i++) {
    ps.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 0.6,
      dx: (Math.random() - 0.5) * 0.25,
      dy: (Math.random() - 0.5) * 0.25,
      o: 0.15 + Math.random() * 0.25
    });
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    ps.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,174,239,${p.o})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
  window.addEventListener("resize", () => {
    w = window.innerWidth; h = window.innerHeight; c.width = w; c.height = h;
  });
})();

/* ========= Dropdown Engine ========= */
function makeDropdown(container, { placeholder = "Choose…", options = [], onChange = () => { }, maxHeight = 260 }) {
  container.classList.add("dd");
  container.innerHTML = `
    <button type="button" class="dd-btn"><span class="dd-label">${placeholder}</span></button>
    <span class="dd-arrow" aria-hidden="true"></span>
    <div class="dd-list" style="max-height:${maxHeight}px"></div>
    <input type="hidden" class="dd-value" value="">
  `;
  const btn = container.querySelector(".dd-btn");
  const list = container.querySelector(".dd-list");
  const label = container.querySelector(".dd-label");
  const input = container.querySelector(".dd-value");
  let state = { open: false, opts: options };

  function render() {
    list.innerHTML = "";
    if (!state.opts || !state.opts.length) {
      list.innerHTML = `<div class="dd-empty">No options</div>`;
      return;
    }
    state.opts.forEach((o, i) => {
      const it = document.createElement("div");
      it.className = "dd-item";
      it.setAttribute("data-value", o.value);
      it.setAttribute("data-index", String(i));
      if (String(input.value) === String(o.value)) it.setAttribute("aria-selected", "true");
      it.textContent = o.label ?? o.value;
      it.addEventListener("click", () => selectIndex(i));
      list.appendChild(it);
    });
  }
  function selectIndex(i) {
    const o = state.opts[i]; if (!o) return;
    input.value = o.value;
    label.textContent = o.label ?? o.value;
    onChange(o.value, o);
    container.classList.remove("open");
    state.open = false;
  }
  btn.addEventListener("click", () => {
    state.open = !state.open;
    container.classList.toggle("open", state.open);
    if (state.open) render();
  });
  document.addEventListener("click", e => {
    if (!container.contains(e.target)) {
      state.open = false;
      container.classList.remove("open");
    }
  });
  render();
  return {
    setOptions(newOpts) { state.opts = newOpts || []; render(); },
    setValue(val) {
      input.value = val;
      const o = state.opts.find(o => String(o.value) === String(val));
      label.textContent = o ? (o.label ?? o.value) : placeholder;
    },
    get value() { return input.value; }
  };
}

/* ========= Case Form ========= */
let ddPressType, ddPress, ddRegion, ddSystem, ddSubsystem,
  ddSeverity, ddCategory, ddOrigin, ddHwSw, ddStatus;

const PRESS_MAP = [
  // דוגמא – כאן תוכל לעדכן בהתאם לרשימה האמיתית:
  // { id: "D9", customer: "Customer A" },
  // { id: "D10", customer: "Customer B" }
];

function getPressOptions() {
  if (!PRESS_MAP.length) return [];
  return PRESS_MAP.map(p => ({ value: p.id, label: `${p.id} · ${p.customer}` }));
}

function initForm() {
  const form = document.getElementById("caseForm");
  if (!form) return;

  ddPressType = makeDropdown(document.getElementById("dd-press-type"), {
    placeholder: "Press Type",
    options: [
      { value: "S10", label: "S10" },
      { value: "S11", label: "S11" },
      { value: "W10", label: "W10" },
      { value: "Other", label: "Other" }
    ]
  });
  ddPress = makeDropdown(document.getElementById("dd-press"), {
    placeholder: "Press Name",
    options: getPressOptions(),
    onChange: (val) => {
      const pm = PRESS_MAP.find(p => p.id === val);
      if (pm) {
        const cust = document.getElementById("customer");
        if (cust && !cust.value) cust.value = pm.customer;
      }
    }
  });
  ddRegion = makeDropdown(document.getElementById("dd-region"), {
    placeholder: "Region",
    options: [
      { value: "NA", label: "North America" },
      { value: "EU", label: "Europe" },
      { value: "APJ", label: "APJ" },
      { value: "IL", label: "Israel" },
      { value: "Other", label: "Other" }
    ]
  });
  ddSystem = makeDropdown(document.getElementById("dd-system"), {
    placeholder: "System",
    options: [
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
      const subs = {
        "Print Engine": ["Ink Delivery", "Imaging", "Registration"],
        "Feeder": ["Loader", "Vacuum", "Sensors"],
        "Coater": ["Varnish", "Anilox", "UV"],
        "Dryer": ["Hot Air", "IR", "Cooling"],
        "ICS": ["ICS SW", "ICS HW"],
        "IRD": ["Mass Balance", "Pipes", "Sensors"],
        "STS": ["Powder", "Vacuum"],
        "Other": []
      }[v] || [];
      ddSubsystem.setOptions(subs.map(x => ({ value: x, label: x })));
    }
  });
  ddSubsystem = makeDropdown(document.getElementById("dd-subsystem"), {
    placeholder: "Sub System",
    options: []
  });
  ddSeverity = makeDropdown(document.getElementById("dd-severity"), {
    placeholder: "Severity",
    options: [
      { value: "Critical", label: "Critical" },
      { value: "High", label: "High" },
      { value: "Medium", label: "Medium" },
      { value: "Low", label: "Low" }
    ]
  });
  ddCategory = makeDropdown(document.getElementById("dd-category"), {
    placeholder: "Category",
    options: [
      { value: "Quality", label: "Quality" },
      { value: "Availability", label: "Availability" },
      { value: "Usability", label: "Usability" },
      { value: "Performance", label: "Performance" },
      { value: "Other", label: "Other" }
    ]
  });
  ddOrigin = makeDropdown(document.getElementById("dd-origin"), {
    placeholder: "Origin",
    options: [
      { value: "Field", label: "Field" },
      { value: "Lab", label: "Lab" },
      { value: "Internal", label: "Internal" },
      { value: "Customer", label: "Customer" }
    ]
  });
  ddHwSw = makeDropdown(document.getElementById("dd-hw-sw"), {
    placeholder: "Type",
    options: [
      { value: "HW", label: "Hardware" },
      { value: "SW", label: "Software" },
      { value: "Mixed", label: "HW + SW" }
    ],
    onChange: (v) => {
      const row = document.getElementById("hwPartRow");
      if (!row) return;
      if (v === "HW" || v === "Mixed") row.classList.remove("hidden");
      else row.classList.add("hidden");
    }
  });
  ddStatus = makeDropdown(document.getElementById("dd-status"), {
    placeholder: "Status",
    options: [
      { value: "Open", label: "Open" },
      { value: "In Progress", label: "In Progress" },
      { value: "Monitoring", label: "Monitoring" },
      { value: "Closed", label: "Closed" }
    ]
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const sfCase = document.getElementById("sfCase").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const description = document.getElementById("description").value.trim();
    if (!sfCase || !subject || !description) {
      toast("Please fill SF Case, Subject & Description", "err");
      return;
    }

    const cases = getCases();
    const now = (new Date()).toISOString().slice(0, 10);
    const currentEditId = window.currentEditId || null;

    const createdAt = document.getElementById("createdAt").value || now;
    const updatedAt = document.getElementById("updatedAt").value || now;
    const hwSw = ddHwSw ? ddHwSw.value : "";
    const hwPart = document.getElementById("hwPart")?.value.trim() || "";

    const base = currentEditId ? cases.find(c => c.id === currentEditId) || {} : {};

    const c = {
      id: currentEditId || Date.now(),
      sfCase,
      pressType: ddPressType?.value || "",
      press: ddPress?.value || "",
      customer: document.getElementById("customer").value.trim(),
      region: ddRegion?.value || "",
      system: ddSystem?.value || "",
      subsystem: ddSubsystem?.value || "",
      swVersion: document.getElementById("swVersion").value.trim(),
      severity: ddSeverity?.value || "",
      category: ddCategory?.value || "",
      origin: ddOrigin?.value || "",
      subject,
      description,
      attachments: document.getElementById("attachments").value.trim(),
      notes: document.getElementById("notes").value.trim(),
      owner: document.getElementById("owner").value.trim(),
      tags: document.getElementById("tags").value.trim(),
      hwSw,
      hwPart,
      targetDate: document.getElementById("targetDate").value,
      status: ddStatus?.value || "",
      createdAt: base.createdAt || createdAt,
      updatedAt,
      rcaLink: document.getElementById("rcaLink").value.trim()
    };
    upsertCase(c);
    window.currentEditId = null;
    toast("Case saved", "ok");
    form.reset();
    ddPressType.setValue("");
    ddPress.setValue("");
    ddRegion.setValue("");
    ddSystem.setValue("");
    ddSubsystem.setValue("");
    ddSeverity.setValue("");
    ddCategory.setValue("");
    ddOrigin.setValue("");
    ddHwSw.setValue("");
    ddStatus.setValue("");
    const row = document.getElementById("hwPartRow");
    row && row.classList.add("hidden");
    updateKPIs();
  });

  document.getElementById("btnResetCaseForm")?.addEventListener("click", () => {
    window.currentEditId = null;
    form.reset();
    ddPressType.setValue("");
    ddPress.setValue("");
    ddRegion.setValue("");
    ddSystem.setValue("");
    ddSubsystem.setValue("");
    ddSeverity.setValue("");
    ddCategory.setValue("");
    ddOrigin.setValue("");
    ddHwSw.setValue("");
    ddStatus.setValue("");
    document.getElementById("hwPartRow")?.classList.add("hidden");
  });
}
initForm();

/* ========= Edit from All Cases ========= */
window.editCaseFromList = function (id) {
  const c = getCaseById(id);
  if (!c) return;
  window.currentEditId = id;
  go("create");
  // Fill form
  document.getElementById("sfCase").value = c.sfCase || "";
  ddPressType.setValue(c.pressType || "");
  ddPress.setValue(c.press || "");
  document.getElementById("customer").value = c.customer || "";
  ddRegion.setValue(c.region || "");
  ddSystem.setValue(c.system || "");
  ddSubsystem.setValue(c.subsystem || "");
  document.getElementById("swVersion").value = c.swVersion || "";
  ddSeverity.setValue(c.severity || "");
  ddCategory.setValue(c.category || "");
  ddOrigin.setValue(c.origin || "");
  document.getElementById("subject").value = c.subject || "";
  document.getElementById("description").value = c.description || "";
  document.getElementById("attachments").value = c.attachments || "";
  document.getElementById("notes").value = c.notes || "";
  document.getElementById("owner").value = c.owner || "";
  document.getElementById("tags").value = c.tags || "";
  ddHwSw.setValue(c.hwSw || "");
  const row = document.getElementById("hwPartRow");
  if (row) {
    if (c.hwSw === "HW" || c.hwSw === "Mixed") row.classList.remove("hidden");
    else row.classList.add("hidden");
  }
  document.getElementById("hwPart").value = c.hwPart || "";
  document.getElementById("targetDate").value = c.targetDate || "";
  ddStatus.setValue(c.status || "");
  document.getElementById("createdAt").value = c.createdAt || "";
  document.getElementById("updatedAt").value = c.updatedAt || "";
  document.getElementById("rcaLink").value = c.rcaLink || "";
};

/* ========= Dashboard KPIs ========= */
function updateKPIs() {
  const cases = getCases();
  const total = cases.length;
  const open = cases.filter(c => c.status === "Open" || c.status === "In Progress").length;
  const critical = cases.filter(c => c.severity === "Critical" || c.severity === "High").length;
  const hw = cases.filter(c => c.hwSw === "HW" || c.hwSw === "Mixed").length;

  const elTotal = document.getElementById("kpiTotal");
  const elOpen = document.getElementById("kpiOpen");
  const elCrit = document.getElementById("kpiCritical");
  const elHW = document.getElementById("kpiHW");
  if (elTotal) elTotal.textContent = total;
  if (elOpen) elOpen.textContent = open;
  if (elCrit) elCrit.textContent = critical;
  if (elHW) elHW.textContent = hw;

  const countEl = document.getElementById("casesCount");
  if (countEl) countEl.textContent = total;

  renderDashboardBreakdowns(cases);
}

function aggregateBy(cases, field, limit = 6) {
  const map = new Map();
  cases.forEach(c => {
    const key = (c[field] || "Unknown").trim() || "Unknown";
    map.set(key, (map.get(key) || 0) + 1);
  });
  const arr = Array.from(map.entries()).map(([label, count]) => ({ label, count }));
  arr.sort((a, b) => b.count - a.count);
  if (limit && arr.length > limit) return arr.slice(0, limit);
  return arr;
}

function renderBarList(containerId, items, filterField) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = "";
  if (!items.length) {
    el.innerHTML = `<div class="bar-row"><span class="bar-label">No data</span></div>`;
    return;
  }
  const max = Math.max(...items.map(i => i.count));
  items.forEach(it => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <span class="bar-label">${esc(it.label)}</span>
      <div class="bar-bar-wrap"><div class="bar-bar" style="width:${(it.count / max) * 100}%"></div></div>
      <span class="bar-count">${it.count}</span>
    `;
    row.addEventListener("click", () => {
      window.pendingCasesFilter = { field: filterField, value: it.label };
      go("cases");
    });
    el.appendChild(row);
  });
}

function renderTimeline(cases) {
  const el = document.getElementById("dashTimeline");
  if (!el) return;
  el.innerHTML = "";
  const map = new Map();
  cases.forEach(c => {
    const d = c.createdAt || "";
    if (!d || d.length < 7) return;
    const year = d.slice(0, 4);
    const month = parseInt(d.slice(5, 7), 10);
    if (!month) return;
    const q = "Q" + (Math.floor((month - 1) / 3) + 1);
    const key = `${year}-${q}`;
    map.set(key, (map.get(key) || 0) + 1);
  });
  const arr = Array.from(map.entries()).map(([k, count]) => ({ key: k, count }));
  arr.sort((a, b) => a.key.localeCompare(b.key));
  if (!arr.length) {
    el.innerHTML = `<div class="timeline-col"><span>No data</span></div>`;
    return;
  }
  const max = Math.max(...arr.map(a => a.count));
  arr.forEach(it => {
    const col = document.createElement("div");
    col.className = "timeline-col";
    col.innerHTML = `
      <div class="timeline-bar-wrap">
        <div class="timeline-bar" style="height:${(it.count / max) * 80 + 10}px"></div>
      </div>
      <div>${esc(it.key)}</div>
      <div>${it.count}</div>
    `;
    col.addEventListener("click", () => {
      window.pendingCasesFilter = { field: "quarter", value: it.key };
      go("cases");
    });
    el.appendChild(col);
  });
}

function renderDashboardBreakdowns(cases) {
  renderBarList("dashBySystem", aggregateBy(cases, "system"), "system");
  renderBarList("dashByCustomer", aggregateBy(cases, "customer"), "customer");

  // HW / SW breakdown
  const hwMap = new Map();
  cases.forEach(c => {
    const k = c.hwSw || "Unknown";
    hwMap.set(k, (hwMap.get(k) || 0) + 1);
  });
  const hwArr = Array.from(hwMap.entries()).map(([label, count]) => ({ label, count }));
  renderBarList("dashHwSw", hwArr, "hwSw");

  // SW version breakdown
  renderBarList("dashByVersion", aggregateBy(cases, "swVersion"), "swVersion");

  // timeline
  renderTimeline(cases);
}

updateKPIs();

/* ========= Settings: Export / Import / Clear ========= */
document.getElementById("btnExportCases")?.addEventListener("click", () => {
  const data = JSON.stringify(getCases(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "landa_cases_v19.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

document.getElementById("inputImportCases")?.addEventListener("change", e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error("invalid structure");
      const current = getCases();
      const merged = [...current];
      imported.forEach(ic => {
        if (!ic || typeof ic !== "object") return;
        // if same id, replace; else push
        const idx = merged.findIndex(c => c.id === ic.id);
        if (idx >= 0) merged[idx] = ic; else merged.push(ic);
      });
      setCases(merged);
      toast("Cases imported", "ok");
    } catch (err) {
      toast("Import failed – invalid file", "err");
    }
  };
  reader.readAsText(file);
});

document.getElementById("btnClearCases")?.addEventListener("click", () => {
  if (!confirm("Clear all cases from this browser?")) return;
  localStorage.removeItem(LS_KEY_CASES);
  setCases([]);
  toast("All cases cleared", "ok");
});

/* ========= Expose helpers to other files ========= */
window.getCases = getCases;
window.setCases = setCases;
window.getCaseById = getCaseById;
window.go = go;
window.toast = toast;
