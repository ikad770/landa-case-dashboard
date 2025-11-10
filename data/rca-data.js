// RCA_DATA — decision trees per main issue.
// You can later replace placeholder ranges/texts with your exact specs & steps.
window.RCA_DATA = {
  setoff: {
    title: "SetOff",
    // Using the mature tree you already got; kept concise here and completed inside fishbone.js defaults.
    // You can override here if you want a custom tree later.
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
          { label: "Non-image area (blanket/transport)", next: "scr_nonimg" },
          { label: "Across web (continuous / periodic)", next: "scr_periodic" }
        ]
      },
      nodes: {
        scr_img: {
          type: "q",
          title: "Likely causes (image area)",
          text: "Select where to focus:",
          options: [
            { label: "INK/Nozzles / debris", next: "leaf_nozzles" },
            { label: "Transfer / media surface", next: "leaf_transfer" }
          ]
        },
        scr_nonimg: {
          type: "q",
          title: "Likely causes (non-image)",
          text: "Select where to focus:",
          options: [
            { label: "Blanket surface / cleaning", next: "leaf_blanket" },
            { label: "Web path rollers / guides", next: "leaf_transport" }
          ]
        },
        scr_periodic: {
          type: "q",
          title: "Periodic scratches",
          text: "Track with job length to estimate roller circumference.",
          options: [
            { label: "Open Web Transport checks", next: "leaf_transport" },
            { label: "Open Blanket checks", next: "leaf_blanket" }
          ]
        },

        // Leaves map to subsystems. Provide real checks/specs later (data/setoff.js or a dedicated file for scratches).
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
        title: "Uniformity – defect type",
        text: "Pick the dominant non-uniformity pattern:",
        options: [
          { label: "Banding (machine direction)", next: "uni_mdir" },
          { label: "Streaks (cross-web)", next: "uni_cw" },
          { label: "Mottle / cloudiness", next: "uni_mottle" }
        ]
      },
      nodes: {
        uni_mdir: {
          type: "q",
          title: "Banding (MD)",
          text: "Start with transport speed / sync & IRD profile",
          options: [
            { label: "Drying/IRD profile", next: "leaf_IRD" },
            { label: "Transport sync/encoders", next: "leaf_transport" }
          ]
        },
        uni_cw: {
          type: "q",
          title: "Streaks (CW)",
          text: "Investigate head rows alignment / IPU balance",
          options: [
            { label: "Heads / jetting alignment", next: "leaf_heads" },
            { label: "IPU balance", next: "leaf_IRD" }
          ]
        },
        uni_mottle: {
          type: "q",
          title: "Mottle / cloudiness",
          text: "Focus on coating viscosity and drying balance",
          options: [
            { label: "ICS / Coating", next: "leaf_ICS" },
            { label: "IRD / STS balance", next: "leaf_drying" }
          ]
        },

        // Leaves
        leaf_transport: { type: "leaf", title: "Transport", subs: ["Rollers","Guides","Tension","Encoders"] },
        leaf_heads:     { type: "leaf", title: "Heads / Jetting", subs: ["Jetting","Alignment","Cleaning"] },
        leaf_IRD:       { type: "leaf", title: "IRD / IPU", subs: ["IRD"] },
        leaf_ICS:       { type: "leaf", title: "ICS", subs: ["ICS"] },
        leaf_drying:    { type: "leaf", title: "Drying balance", subs: ["IRD","STS","Powder"] }
      }
    }
  },

  pq: {
    title: "PQ (Print Quality)",
    tree: {
      root: {
        type: "q",
        title: "PQ – choose symptom",
        text: "Which print quality symptom best matches?",
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
          text: "Start with purge/clean & filtration",
          options: [
            { label: "Open Jetting checks", next: "leaf_jetting" },
            { label: "Open Cleaning/Filtration", next: "leaf_clean" }
          ]
        },
        pq_reg: {
          type: "q",
          title: "Registration",
          text: "Investigate web tension & encoders",
          options: [
            { label: "Web tension / encoders", next: "leaf_transport" }
          ]
        },
        pq_density: {
          type: "q",
          title: "Density variation",
          text: "Check coating/drying synergy",
          options: [
            { label: "ICS / Coating", next: "leaf_ICS" },
            { label: "IRD / STS", next: "leaf_drying" }
          ]
        },

        // Leaves
        leaf_jetting:   { type: "leaf", title: "Jetting", subs: ["Jetting"] },
        leaf_clean:     { type: "leaf", title: "Cleaning / Filtration", subs: ["Cleaning","Filtration"] },
        leaf_transport: { type: "leaf", title: "Transport", subs: ["Rollers","Guides","Tension","Encoders"] },
        leaf_ICS:       { type: "leaf", title: "ICS", subs: ["ICS"] },
        leaf_drying:    { type: "leaf", title: "Drying balance", subs: ["IRD","STS","Powder"] }
      }
    }
  }
};
