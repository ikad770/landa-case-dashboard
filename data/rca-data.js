/* Root Cause Analyzer – data model (SetOff / IRD only for now) */

const RCA_DATA = {
  issues: [
    { id: "setoff", label: "SetOff" },
    { id: "scratches", label: "Scratches" },
    { id: "uniformity", label: "Uniformity" },
    { id: "pq", label: "PQ" }
  ],

  /* IRD parameters – based על ה-Visio שלך (SetOff flow) */
  IRD: [
    {
      id: "spec_1",
      label: "IR Vacuum (Spec 1)",
      type: "range",
      unit: "mbar",
      min: 2000,
      max: 2400,
      tip: "Typical IR vacuum window for stable drying."
    },
    {
      id: "spec_2",
      label: "IR Power (Spec 2)",
      type: "range",
      unit: "%",
      min: 60,
      max: 80,
      tip: "Power window for IR zone according to the SetOff checklist."
    },
    {
      id: "spec_3",
      label: "IPU Pressure",
      type: "range",
      unit: "bar",
      min: 4.0,
      max: 6.0,
      tip: "Check against the IPU pressure specification for this press."
    },
    {
      id: "spec_4",
      label: "AFIPU Vacuum",
      type: "range",
      unit: "mbar",
      min: 1500,
      max: 2200,
      tip: "Should be within the AFIPU operating range."
    },
    {
      id: "spec_5",
      label: "ADY1 / ADY2 Temperature",
      type: "range",
      unit: "°C",
      min: 70,
      max: 90,
      tip: "Both ADY zones must be in the same temperature window."
    },
    {
      id: "check_6",
      label: "IR Slits Calibration Verification",
      type: "boolean",
      tip: "Is the IR slits calibration OK according to the maintenance procedure?"
    }
  ]
};
