// rca-data.js – IRD spec & questions for SetOff (from your Visio idea, simplified)

window.RCA_DATA = {
  IRD: [
    {
      id: 'ird_temp',
      label: 'IRD temperature (average °C)',
      unit: '°C',
      min: 70,
      max: 90,
      weight: 3,
      factor: 'Thermal energy'
    },
    {
      id: 'ird_power',
      label: 'IRD power level',
      unit: '%',
      min: 70,
      max: 100,
      weight: 2,
      factor: 'Thermal energy'
    },
    {
      id: 'ird_speed',
      label: 'Web speed',
      unit: 'm/min',
      min: 60,
      max: 200,
      weight: 2,
      factor: 'Process balance'
    },
    {
      id: 'ird_airflow',
      label: 'Airflow / exhaust OK?',
      unit: 'OK?',
      min: null,
      max: null,
      type: 'boolean',
      weight: 2,
      factor: 'Airflow'
    },
    {
      id: 'ird_humidity',
      label: 'Ambient RH',
      unit: '%',
      min: 35,
      max: 60,
      weight: 1,
      factor: 'Environment'
    }
  ]
};
