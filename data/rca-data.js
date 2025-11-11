// /data/rca-data.js
// Decision trees per main issue. Extend freely later.

window.RCA_DATA = {
  setoff: {
    title: "SetOff",
    // אם תרצה לעקוף את ברירת־המחדל ב-wizard.js, תוכל לספק כאן tree מלא.
    // tree: { root:{...}, nodes:{...} }
  },

  scratches: {
    title: "Scratches",
    tree: {
      root: {
        type: "q",
        title: "Scratches – first localization",
        text: "Where are the scratches observed?",
        options: [
          { label: "Image area", next: "scr_img" },
          { label: "Non-image (blanket/transport)", next: "scr_nonimg" },
          { label: "Across web (periodic)", next: "scr_periodic" }
        ]
      },
      nodes: {
        scr_img: {
          type: "q",
          title: "Likely causes (image area)",
          text: "Pick where to focus:",
          options: [
            { label: "Nozzles / debris", next: "leaf_nozzles" },
            { label: "Transfer / media", next: "leaf_transfer" }
          ]
        },
        scr_nonimg: {
          type: "q",
          title: "Likely causes (non-image)",
          text: "Pick where to focus:",
          options: [
            { label: "Blanket surface", next: "leaf_blanket" },
            { label: "Web transport", next: "leaf_transport" }
          ]
        },
        scr_periodic: {
          type: "q",
          title: "Periodic scratches",
          text: "Track with job length ~ roller circumference.",
          options: [
            { label: "Transport path", next: "leaf_transport" },
            { label: "Blanket", next: "leaf_blanket" }
          ]
        },
        leaf_nozzles:  { type: "leaf", title: "Nozzles / Heads", subs: ["Jetting","Cleaning","Filtration"] },
        leaf_transfer: { type: "leaf", title: "Transfer / Media", subs: ["Transfer","Media"] },
        leaf_blanket:  { type: "leaf", title: "Blanket", subs: ["Blanket"] },
        leaf_transport:{ type: "leaf", title: "Web Transport", subs: ["Rollers","Guides","Tension"] }
      }
    }
  },

  uniformity: {
    title: "Uniformity",
    tree: {
      root: {
        type: "q",
        title: "Uniformity – select pattern",
        text: "Choose the dominant pattern:",
        options: [
          { label: "Banding (MD)", next: "uni_mdir" },
          { label: "Streaks (CW)", next: "uni_cw" },
          { label: "Mottle / cloudiness", next: "uni_mottle" }
        ]
      },
      nodes: {
        uni_mdir: {
          type: "q",
          title: "Banding (MD)",
          text: "Start with transport sync & drying profile.",
          options: [
            { label: "IRD profile", next: "leaf_IRD" },
            { label: "Transport/encoders", next: "leaf_transport" }
          ]
        },
        uni_cw: {
          type: "q",
          title: "Streaks (CW)",
          text: "Heads alignment / IPU balance.",
          options: [
            { label: "Heads / jetting align", next: "leaf_heads" },
            { label: "IPU balance", next: "leaf_IRD" }
          ]
        },
        uni_mottle: {
          type: "q",
          title: "Mottle / cloudiness",
          text: "Coating viscosity vs. drying balance.",
          options: [
            { label: "ICS / Coating", next: "leaf_ICS" },
            { label: "IRD / STS balance", next: "leaf_drying" }
          ]
        },
        leaf_transport: { type: "leaf", title: "Transport", subs: ["Rollers","Guides","Tension","Encoders"] },
        leaf_heads:     { type: "leaf", title: "Heads / Jetting", subs: ["Jetting","Alignment","Cleaning"] },
        leaf_IRD:       { type: "leaf", title: "IRD / IPU", subs: ["IRD"] },
        leaf_ICS:       { type: "leaf", title: "ICS", subs: ["ICS"] },
        leaf_drying:    { type: "leaf", title: "Drying", subs: ["IRD","STS","Powder"] }
      }
    }
  },

  pq: {
    title: "PQ",
    tree: {
      root: {
        type: "q",
        title: "PQ – pick symptom",
        text: "Select the print quality symptom:",
        options: [
          { label: "Missing dots / nozzles", next: "pq_nozzles" },
          { label: "Registration / alignment", next: "pq_reg" },
          { label: "Density variation", next: "pq_density" }
        ]
      },
      nodes: {
        pq_nozzles: {
          type: "q",
          title: "Nozzles",
          text: "Purge/clean & filtration.",
          options: [
            { label: "Open Jetting checks", next: "leaf_jetting" },
            { label: "Cleaning/Filtration", next: "leaf_clean" }
          ]
        },
        pq_reg: {
          type: "q",
          title: "Registration",
          text: "Web tension & encoders.",
          options: [
            { label: "Transport/encoders", next: "leaf_transport" }
          ]
        },
        pq_density: {
          type: "q",
          title: "Density variation",
          text: "Coating/drying synergy.",
          options: [
            { label: "ICS / Coating", next: "leaf_ICS" },
            { label: "IRD / STS", next: "leaf_drying" }
          ]
        },
        leaf_jetting:   { type: "leaf", title: "Jetting", subs: ["Jetting"] },
        leaf_clean:     { type: "leaf", title: "Cleaning / Filtration", subs: ["Cleaning","Filtration"] },
        leaf_transport: { type: "leaf", title: "Transport", subs: ["Rollers","Guides","Tension","Encoders"] },
        leaf_ICS:       { type: "leaf", title: "ICS", subs: ["ICS"] },
        leaf_drying:    { type: "leaf", title: "Drying", subs: ["IRD","STS","Powder"] }
      }
    }
  }
};
