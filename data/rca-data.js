// Minimal RCA data – IRD path for SetOff (example structure)
window.RCA_DATA = {
  issues: {
    setoff: {
      id: 'setoff',
      label: 'SetOff',
      description: 'Drying / Coating related set-off issue',
      entryNode: 'setoff_ird_or_coating'
    },
    scratches: {
      id: 'scratches',
      label: 'Scratches',
      description: 'Scratches on print / blanket – flow TBD',
      entryNode: null
    },
    uniformity: {
      id: 'uniformity',
      label: 'Uniformity',
      description: 'Bands / density – flow TBD',
      entryNode: null
    },
    pq: {
      id: 'pq',
      label: 'PQ',
      description: 'Overall print quality – flow TBD',
      entryNode: null
    }
  },

  // Simple decision tree for IRD only (from Visio logic – conceptually)
  nodes: {
    setoff_ird_or_coating: {
      id: 'setoff_ird_or_coating',
      type: 'question',
      text: 'Where does the set-off appear to originate?',
      options: [
        {id:'opt_ird_only',label:'IRD only',next:'setoff_ird_entry'},
        {id:'opt_coating_only',label:'Coating only',next:'setoff_coating_placeholder'},
        {id:'opt_both',label:'Both IRD and coating',next:'setoff_ird_entry'}
      ]
    },

    setoff_ird_entry: {
      id: 'setoff_ird_entry',
      type: 'question',
      text: 'IRD – which side / zone is affected?',
      options: [
        {id:'opt_ird_all',label:'All IPUs / all sides',next:'setoff_ird_all_ipu'},
        {id:'opt_ird_single',label:'Single IPU / local area',next:'setoff_ird_single_ipu'}
      ]
    },

    setoff_ird_all_ipu: {
      id: 'setoff_ird_all_ipu',
      type: 'question',
      text: 'Check IRD main parameters',
      options: [
        {id:'opt_ird_temp_low',label:'Temperature below spec',next:'diag_ird_increase_temp'},
        {id:'opt_ird_power_low',label:'Power / % below spec',next:'diag_ird_increase_power'},
        {id:'opt_ird_ok',label:'All parameters already in spec',next:'diag_ird_call_support'}
      ]
    },

    setoff_ird_single_ipu: {
      id: 'setoff_ird_single_ipu',
      type: 'question',
      text: 'Single IPU – suspect local issue',
      options: [
        {id:'opt_ird_lamp',label:'Lamp suspected / aged',next:'diag_ird_check_lamp'},
        {id:'opt_ird_sensor',label:'Sensor reading abnormal',next:'diag_ird_check_sensor'},
        {id:'opt_ird_mechanical',label:'Mechanical / airflow issue',next:'diag_ird_check_airflow'}
      ]
    },

    // Placeholder nodes
    setoff_coating_placeholder: {
      id: 'setoff_coating_placeholder',
      type: 'diagnosis',
      title: 'Coating system suspected',
      summary: 'Follow coating checklist: pump pressure, viscosity, applicator alignment, UV lamps, profile.',
      actions: [
        'Verify coating pump pressure is within spec',
        'Check coating viscosity and level in tank',
        'Inspect applicator alignment across web',
        'Ensure all UV lamps are on and at correct power',
        'Confirm correct coating profile is selected for this media'
      ]
    },

    diag_ird_increase_temp: {
      id: 'diag_ird_increase_temp',
      type: 'diagnosis',
      title: 'IRD temperature below spec',
      summary: 'Increase IRD temperature gradually within spec and reprint test sheet.',
      actions: [
        'Compare current IRD temperature setpoint vs spec for this media and speed',
        'Increase temperature in small steps (e.g. +5°C) and re-run test',
        'Verify no media damage or over-drying',
        'Document final temperature used and store as reference'
      ]
    },
    diag_ird_increase_power: {
      id: 'diag_ird_increase_power',
      type: 'diagnosis',
      title: 'IRD power below spec',
      summary: 'Increase IRD power (%) for relevant IPUs within allowed spec, then test again.',
      actions: [
        'Check IPU power % vs spec table for this media',
        'Increase power gradually while monitoring set-off',
        'Ensure IRD cooling / ventilation is working properly',
        'Update job preset if new settings are stable'
      ]
    },
    diag_ird_call_support: {
      id: 'diag_ird_call_support',
      type: 'diagnosis',
      title: 'IRD parameters are in spec',
      summary: 'Parameters look correct – escalate to advanced support / service.',
      actions: [
        'Capture logs and screenshots of IRD parameters',
        'Save test sheets (before / after)',
        'Open SF case and attach print samples + parameter dump',
        'Contact Landa service for deeper root cause analysis'
      ]
    },
    diag_ird_check_lamp: {
      id: 'diag_ird_check_lamp',
      type: 'diagnosis',
      title: 'Single IPU – lamp suspected',
      summary: 'Lamp aging or failure may cause local set-off.',
      actions: [
        'Check lamp usage hours vs replacement spec',
        'Measure lamp output if tools exist',
        'Swap lamps between IPUs (if allowed) to see if defect moves',
        'Replace lamp if output is low or unstable'
      ]
    },
    diag_ird_check_sensor: {
      id: 'diag_ird_check_sensor',
      type: 'diagnosis',
      title: 'Single IPU – sensor suspected',
      summary: 'Temperature / feedback sensor may be misreading.',
      actions: [
        'Verify sensor wiring and connectors',
        'Compare sensor reading vs external reference (if possible)',
        'Check for loose mounting or contamination',
        'Replace sensor if readings are not reliable'
      ]
    },
    diag_ird_check_airflow: {
      id: 'diag_ird_check_airflow',
      type: 'diagnosis',
      title: 'Single IPU – airflow / mechanical issue',
      summary: 'Local airflow reduction can cause set-off.',
      actions: [
        'Inspect ducts / filters for blockages',
        'Verify fans are running and spinning freely',
        'Check mechanical alignment of IRD module',
        'Clean components and retest with same job'
      ]
    }
  }
};
