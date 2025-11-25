// data/rca-data.js
// Root Cause Analyzer – data model and ENUMS (V1.0)

// ==== הגדרות גלובליות לטופס יצירת קייס חדש (מחייב) ====
window.LANDA_ENUMS = {
  // 1. מערכות ותתי-מערכות (System & Subsystem)
  SYSTEMS: [
    { id: 'IPS', name: 'IPS - Ink Priming System', subs: ['Ink Station 1', 'Ink Station 2', 'Ink Pump', 'Ink Heater'] },
    { id: 'IRD', name: 'IRD - Infrared Dryer', subs: ['IRD Section 1', 'IRD Section 2', 'Temp Sensors', 'Air Flow'] },
    { id: 'BCU', name: 'BCU - Blanketing Unit', subs: ['BCU Main', 'Filter System', 'Nozzles', 'BCU Pressure'] },
    { id: 'STS', name: 'STS - Substrate Transport System', subs: ['Paper Feed', 'Grips', 'Drums', 'Paper Exit'] },
    { id: 'DFE', name: 'DFE - Digital Front End', subs: ['RIP', 'Calibration', 'Color Management', 'Workstation'] },
    { id: 'ICS', name: 'ICS - Coating System', subs: ['Coating Pump', 'Coating Unit', 'Cure Lamps'] },
    { id: 'OTHER', name: 'Other / External', subs: ['Electrical', 'Facilities', 'Operator Error', 'External SW'] },
  ],

  // 2. קודי תקלה/סוגי בעיות (Issue Codes) - משמש להפעלת ה-RCA Wizard
  ISSUE_CODES: [
    { id: 'SETOFF', name: 'SetOff / Smudging', priority: 1, desc: 'Ink transfer after drying.' },
    { id: 'SCRATCHES', name: 'Scratches / Marks', priority: 2, desc: 'Physical damage on the print.' },
    { id: 'BANDING', name: 'Banding / Streaks', priority: 3, desc: 'Visible lines across the print.' },
    { id: 'DROPOUT', name: 'Ink Drop Out / Missing Nozzle', priority: 4, desc: 'Missing ink or white lines.' },
    { id: 'COMM', name: 'Communication / SW Error', priority: 5, desc: 'Network or software related failure.' },
    { id: 'PQ_MISC', name: 'Print Quality - Other', priority: 6, desc: 'Non-categorized PQ issues.' },
  ],

  // 3. דרגת קושי של הפתרון (Solution Difficulty) - משמש לדירוג
  DIFFICULTY_LEVELS: [
    { id: 'EASY', name: 'Easy', level: 1, desc: 'Operator level, simple reset/cleaning.' },
    { id: 'MEDIUM', name: 'Medium', level: 2, desc: 'Field Service Engineer (FSE) level, parts replacement, calibration.' },
    { id: 'HARD', name: 'Hard', level: 3, desc: 'Expert level, deep diagnostics, complex replacement.' },
  ]
};

// ==== RCA WIZARD DATA (RCA_DATA) - נשאר כבסיס ל-fishbone.js ====
window.RCA_DATA = {
  /* ========= SETOFF ========= */
  setoff: {
    code: "setoff",
    title: "SetOff",
    description: "Guided root-cause analysis for SetOff issues, based on machine subsystems and spec checks.",

    // High-level triage questions
    triage: [
      {
        id: "coating_mode",
        label: "When does the SetOff appear?",
        type: "choice",
        help: "Choose the closest scenario according to the customer complaint / test print.",
        options: [
          { value: "with", label: "Only with coating" },
          { value: "without", label: "Only without coating" },
          { value: "both", label: "With & without coating" }
        ]
      }
    ],

    // Which subsystems are relevant per triage result
    triageBranch: {
      with: ["ICS", "Powder", "STS"],
      without: ["IPS", "BCU", "IRD", "BCS", "STS", "DFE"],
      both: ["IPS", "BCU", "IRD", "BCS", "STS", "DFE", "ICS", "Powder"]
    },

    /* ===== Subsystems (per VISIO) ===== */
    subsystems: {
      /* --- IRD: מתוך ה-Visio שעשית --- */
      IRD: {
        id: "IRD",
        title: "IRD – Infrared Dryer",
        mechanism: "drying",
        description: "Focus on drying efficiency and settings.",
        checks: [
          { id: "IRD_temp", label: "Check IRD Temperatures (Zone 1-4)", type: "text", unit: "C", spec: "110-120" },
          { id: "IRD_power", label: "IRD Power Profile (Spec?)", type: "choice", options: [{ value: "ok", label: "In Spec" }, { value: "bad", label: "Out of Spec" }] },
          { id: "IRD_air", label: "Airflow Sensor Status", type: "choice", options: [{ value: "ok", label: "OK" }, { value: "bad", label: "LOW/High" }] },
        ]
      },
      IPS: {
        id: "IPS",
        title: "IPS – Ink Priming System",
        mechanism: "ink",
        description: "Ink and pressure related checks (placeholder).",
        checks: []
      },
      BCU: {
        id: "BCU",
        title: "BCU – Blanketing Unit",
        mechanism: "mechanics",
        description: "BCU / Pressing checks (placeholder).",
        checks: []
      },
      STS: {
        id: "STS",
        title: "STS – Substrate Transport System",
        mechanism: "transport",
        description: "Paper transport and registration checks (placeholder).",
        checks: []
      },
      DFE: {
        id: "DFE",
        title: "DFE",
        mechanism: "rip",
        description: "DFE / RIP related checks (placeholder).",
        checks: []
      },
      ICS: {
        id: "ICS",
        title: "ICS – Coating System",
        mechanism: "coating",
        description: "ICS coating related checks (placeholder).",
        checks: []
      }
    }
  },
  /* ========= SCRATCHES (Placeholder) - הוספת מבנה ריק לחיבור עתידי ========= */
  scratches: {
    code: "scratches",
    title: "Scratches",
    description: "Basic wizard for print scratches investigation (placeholder).",
    triage: [],
    triageBranch: {},
    subsystems: {}
  },
  /* ========= BANDING (Placeholder) ========= */
  banding: {
    code: "banding",
    title: "Banding",
    description: "Placeholder for banding based RCA.",
    triage: [],
    triageBranch: {},
    subsystems: {}
  }
};
