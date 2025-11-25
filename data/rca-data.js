// data/rca-data.js
// Root Cause Analyzer – SetOff IRD model (simplified but structured)

window.RCA_DATA = {
  issues: [
    {
      code: "setoff",
      title: "SetOff",
      description:
        "Guided IRD-based triage for SetOff behaviour on Quantum presses, aligned with IRD / SetOff VISIO logic.",

      steps: [
        {
          id: "triage_mode",
          label: "Print Mode & Coating",
          type: "choice",
          question: "When does the SetOff appear?",
          help: "Classify the scenario to narrow down relevant subsystems according to IRD.",
          options: [
            { value: "with", label: "Only with coating" },
            { value: "without", label: "Only without coating" },
            { value: "both", label: "With & without coating" }
          ]
        },
        {
          id: "triage_area",
          label: "Location on Sheet",
          type: "choice",
          question: "Where does the SetOff appear on the sheet?",
          help: "This drives whether the risk is more related to IRD / Coater / Transport.",
          options: [
            { value: "leading_edge", label: "Leading edge / 1st 10 cm" },
            { value: "trailing_edge", label: "Trailing edge / last 10 cm" },
            { value: "full_sheet", label: "Uniform across sheet" },
            { value: "random", label: "Random areas / patches" }
          ]
        },
        {
          id: "triage_severity",
          label: "Impact",
          type: "choice",
          question: "What is the impact on production?",
          help: "Use SF Case severity definition as reference.",
          options: [
            { value: "critical", label: "Critical – press stop / scrap majority of job" },
            { value: "high", label: "High – repeated customer complaints / reprints" },
            { value: "medium", label: "Medium – internal detection, limited scrap" },
            { value: "low", label: "Low – cosmetic / rare" }
          ]
        },
        {
          id: "system_focus",
          label: "Main Suspected System",
          type: "choice",
          question: "Which system is suspected according to first checks?",
          help: "Select based on initial evidence, not on speculation.",
          options: [
            { value: "IRD", label: "IRD" },
            { value: "ICS", label: "ICS" },
            { value: "STS", label: "STS / Powder" },
            { value: "BCU", label: "BCU / Web handling" },
            { value: "DFE", label: "DFE / RIP (screening / separations)" },
            { value: "undecided", label: "Not sure yet" }
          ]
        },
        {
          id: "ird_checks",
          label: "IRD Validation",
          type: "checklist",
          appliesIf: { field: "system_focus", isIn: ["IRD", "undecided"] },
          question: "Perform IRD specific validations:",
          help: "Follow IRD UG and SetOff IRD flow. Document each step.",
          checks: [
            {
              id: "ird_mode",
              label: "Correct IRD operating mode",
              prompt: "Verify IRD is in the correct mode according to media, speed and job type."
            },
            {
              id: "ird_setpoints",
              label: "Setpoints vs IRD spec",
              prompt: "Compare actual IRD setpoints to recommended spec for this media & speed."
            },
            {
              id: "mass_balance",
              label: "Mass balance kit installed and validated",
              prompt: "Validate mass balance kit installation and calibration according to IRD UG."
            },
            {
              id: "ird_pipes",
              label: "IRD pipes integrity",
              prompt: "Check IRD pipes for leaks, damage, or wrong routing."
            },
            {
              id: "ird_sensors",
              label: "Sensors status & calibration",
              prompt: "Check IRD sensors status on ICS and run calibration if required."
            }
          ]
        },
        {
          id: "ics_checks",
          label: "ICS / Recipe Validation",
          type: "checklist",
          appliesIf: { field: "system_focus", isIn: ["ICS", "undecided"] },
          question: "Validate ICS configuration & job recipe:",
          help: "Ensure recipe parameters match actual job / media.",
          checks: [
            {
              id: "recipe_selection",
              label: "Correct recipe",
              prompt: "Verify the selected recipe matches the actual media and finishing setup."
            },
            {
              id: "speed_vs_ird",
              label: "Speed vs IRD capability",
              prompt: "Confirm press speed is within IRD spec for the selected recipe."
            },
            {
              id: "coating_curve",
              label: "Coating curve",
              prompt: "Validate that coating amount / curve is appropriate, not over-coverage."
            }
          ]
        },
        {
          id: "sts_checks",
          label: "STS / Powder System",
          type: "checklist",
          appliesIf: { field: "system_focus", isIn: ["STS", "undecided"] },
          question: "Check powder / STS subsystem:",
          help: "Improper powder or STS conditions might worsen SetOff behaviour.",
          checks: [
            {
              id: "powder_type",
              label: "Powder type and grain size",
              prompt: "Check powder spec vs recommended for job and substrate."
            },
            {
              id: "powder_amount",
              label: "Powder amount",
              prompt: "Validate powder volume is within spec – not too low and not excessive."
            },
            {
              id: "sts_airflow",
              label: "STS airflow",
              prompt: "Verify STS airflow and vacuum are in the recommended range."
            }
          ]
        },
        {
          id: "bcu_checks",
          label: "BCU / Transport",
          type: "checklist",
          appliesIf: { field: "system_focus", isIn: ["BCU", "undecided"] },
          question: "Check BCU and transport path:",
          help: "Focus on sheet handling that may cause contact before full drying.",
          checks: [
            {
              id: "sheet_overlap",
              label: "Sheet overlap / offset",
              prompt: "Check sheet overlap settings and ensure no premature contact points."
            },
            {
              id: "guides_rollers",
              label: "Guides / rollers condition",
              prompt: "Inspect guides and rollers for contamination that may transfer ink."
            }
          ]
        },
        {
          id: "dfe_checks",
          label: "DFE / Data level",
          type: "checklist",
          appliesIf: { field: "system_focus", isIn: ["DFE", "undecided"] },
          question: "DFE level verification:",
          help: "Rare but important for specific screening / separation setups.",
          checks: [
            {
              id: "screening",
              label: "Screening method",
              prompt: "Verify screening / screening angle are aligned with recommended setup."
            },
            {
              id: "separations",
              label: "Separations / solids",
              prompt: "Validate no unexpected 100% solids on top of heavy coverage zones."
            }
          ]
        },
        {
          id: "summary",
          label: "Summary & Recommendation",
          type: "summary",
          question: "Review all inputs and suggested actions:",
          help: "This step aggregates likelihood and effort for each subsystem."
        }
      ],

      // Mapping from checks to recommendation metadata (for rating display)
      recommendations: [
        {
          refStep: "ird_checks",
          subsystem: "IRD",
          effort: "Medium",
          impact: "High",
          successRate: 0.7,
          text: "Align IRD setpoints + validate mass balance and pipes before moving to non-IRD systems."
        },
        {
          refStep: "ics_checks",
          subsystem: "ICS",
          effort: "Low",
          impact: "Medium",
          successRate: 0.55,
          text: "Fix obvious recipe mismatches (media, speed, coating curve) early."
        },
        {
          refStep: "sts_checks",
          subsystem: "STS",
          effort: "Low",
          impact: "Medium",
          successRate: 0.45,
          text: "Tune powder type / amount and STS airflow."
        },
        {
          refStep: "bcu_checks",
          subsystem: "BCU",
          effort: "Medium",
          impact: "Medium",
          successRate: 0.35,
          text: "Eliminate early contact and contamination in the transport path."
        },
        {
          refStep: "dfe_checks",
          subsystem: "DFE",
          effort: "High",
          impact: "Low",
          successRate: 0.15,
          text: "Escalate to DFE / RIP expert only after HW / IRD / ICS path is exhausted."
        }
      ],

      // Fishbone view (for fishbone.js)
      fishbone: {
        effect: "SetOff on sheets",
        branches: [
          {
            category: "IRD",
            causes: [
              "Incorrect IRD mode",
              "Setpoints out of spec",
              "Leaks / wrong piping",
              "Uncalibrated sensors"
            ]
          },
          {
            category: "Coating / ICS",
            causes: [
              "Recipe mismatch to media",
              "Excessive coating amount",
              "Incompatible coating / substrate"
            ]
          },
          {
            category: "STS / Powder",
            causes: [
              "Wrong powder type",
              "Too low powder amount",
              "STS airflow misconfigured"
            ]
          },
          {
            category: "Transport / BCU",
            causes: [
              "Premature sheet contact",
              "Contaminated rollers / guides"
            ]
          },
          {
            category: "DFE / Data",
            causes: [
              "Aggressive screening setup",
              "Unexpected 100% solids zones"
            ]
          }
        ]
      }
    }
  ]
};
