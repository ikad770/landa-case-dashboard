// RCA data model – currently focused on SetOff / IRD
// Each question can be:
//  type: "range"  -> numeric with min/max spec
//  type: "check"  -> checkbox (OK / Not OK / N.A.)

window.RCA_DATA = {
  setoff: {
    label: 'SetOff',
    irs: {
      label: 'IRD',
      questions: [
        {
          id: 'ird_temp_exit',
          label: 'Sheet temperature at IRD exit',
          type: 'range',
          unit: '°C',
          min: 45,
          max: 60,
          tip: 'Measure with IR thermometer at IRD exit on the printed sheet.'
        },
        {
          id: 'ird_power_level',
          label: 'IRD power level (job setting)',
          type: 'range',
          unit: '%',
          min: 70,
          max: 100,
          tip: 'Check the job parameters for IRD power configuration.'
        },
        {
          id: 'ird_airflow',
          label: 'Air flow / extraction around IRD',
          type: 'check',
          prompt: 'Proper airflow, no blocked ducts, no visible smoke accumulation.'
        },
        {
          id: 'ird_contamination',
          label: 'IRD contamination',
          type: 'check',
          prompt: 'No heavy contamination on IR lamps or glasses.'
        },
        {
          id: 'ird_web_speed',
          label: 'Web / transport speed vs reference',
          type: 'range',
          unit: 'm/min',
          min: 0,
          max: 120,
          tip: 'Compare to default process speed for this media / application.'
        }
      ]
    }
  }
  // TODO: add Scratches / Uniformity / PQ fishbone branches once data is ready
};
