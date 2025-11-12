/* RCA_DATA – Issues → Triage → Mechanisms → Subsystems → Checks (with SPEC)
   This file is pure data. The wizard renders from it dynamically. */

window.RCA_DATA = {
  setoff: {
    code: 'setoff',
    title: 'SetOff',
    description: 'Ink transfers to the next sheet or surface due to insufficient drying/coating behavior.',
    triage: [
      { id:'coat_comp', label:'Compare job with & without coating', type:'choice',
        options:[
          { value:'drying',  label:'Without coating is NOT properly dried'  },
          { value:'coating', label:'With coating is NOT properly dried'     },
          { value:'both',    label:'Both are NOT properly dried'            }
        ],
        score: { // scoring hints by answer (mechanism weights)
          drying:  { heat: 0.6, flow: 0.3 },
          coating: { coat: 0.7, heat: 0.2 },
          both:    { heat: 0.5, flow: 0.2, coat: 0.3 }
        }
      },
      { id:'coverage', label:'SetOff coverage pattern', type:'chips',
        options:[
          { value:'solid',   label:'Solid / Full area' },
          { value:'image',   label:'Image only'        },
          { value:'random',  label:'Random / Spots'    }
        ],
        score: {
          solid:  { heat: 0.3, flow: 0.3, contact: 0.2 },
          image:  { coat: 0.3, heat: 0.2 },
          random: { flow: 0.3, contact: 0.2 }
        }
      },
      { id:'side', label:'Where is the issue observed?', type:'chips',
        options:[
          { value:'top',    label:'Top side'    },
          { value:'back',   label:'Back side'   },
          { value:'both',   label:'Both sides'  }
        ],
        score: {
          top:  { coat:0.2 },
          back: { transport:0.2 },
          both: { heat:0.2, flow:0.2 }
        }
      }
    ],

    mechanisms: [
      { id:'heat',     title:'Thermal / Heat deficit' },
      { id:'flow',     title:'Air flow / Exhaust' },
      { id:'coat',     title:'Coating profile / chemistry' },
      { id:'transport',title:'Transport contact / pressure' },
      { id:'contact',  title:'Contact surfaces contamination' }
    ],

    subsystems: {
      // Drying branch
      IRD: {
        mechanism: 'heat',
        checks: [
          { id:'ipu1', label:'IPU 1 Temperature',    unit:'°C', spec:[7.0, 9.0] },
          { id:'ipu2', label:'IPU 2 Temperature',    unit:'°C', spec:[7.0, 9.0] },
          { id:'ipu3', label:'IPU 3 Temperature',    unit:'°C', spec:[7.0, 9.0] },
          { id:'ipu4', label:'IPU 4 Temperature',    unit:'°C', spec:[7.0, 9.0] },
          { id:'ipu5', label:'IPU 5 Temperature',    unit:'°C', spec:[7.0, 9.0] },
          { id:'ipu6', label:'IPU 6 Temperature',    unit:'°C', spec:[7.0, 9.0] },
          { id:'ipu7', label:'IPU 7 Temperature',    unit:'°C', spec:[7.0, 9.0] },
          { id:'x1',   label:'IRD X Extrusion 1',    unit:'m³/h', spec:[7.0, 9.0] },
          { id:'x2',   label:'IRD X Extrusion 2',    unit:'m³/h', spec:[7.0, 9.0] },
          { id:'x3',   label:'IRD X Extrusion 3',    unit:'m³/h', spec:[7.0, 9.0] },
          { id:'x4',   label:'IRD X Extrusion 4',    unit:'m³/h', spec:[7.0, 9.0] },
          { id:'x5',   label:'IRD X Extrusion 5',    unit:'m³/h', spec:[7.0, 9.0] },
          { id:'x6',   label:'IRD X Extrusion 6',    unit:'m³/h', spec:[7.0, 9.0] },
          { id:'x7',   label:'IRD X Extrusion 7',    unit:'m³/h', spec:[7.0, 9.0] },
          { id:'x8',   label:'IRD X Extrusion 8',    unit:'m³/h', spec:[7.0, 9.0] },
          { id:'x9',   label:'IRD X Extrusion 9',    unit:'m³/h', spec:[7.0, 9.0] },
          { id:'x10',  label:'IRD X Extrusion 10',   unit:'m³/h', spec:[7.0, 9.0] },
          { id:'x11',  label:'IRD X Extrusion 11',   unit:'m³/h', spec:[7.0, 9.0] }
        ],
        tips: [
          'Verify IR lamps status and thermal sensors.',
          'Balance extrusions; avoid >10% delta between adjacent extrusions.'
        ]
      },
      STS: {
        mechanism: 'flow',
        checks: [
          { id:'sts_air',   label:'STS Airflow',              unit:'m³/h', spec:[60, 90] },
          { id:'exhaust',   label:'Exhaust Level',            unit:'%',   spec:[60, 90] },
          { id:'humidity',  label:'Ambient Humidity',         unit:'%',   spec:[35, 55] },
          { id:'speed',     label:'Transport Speed',          unit:'m/min', spec:[80, 120] }
        ],
        tips: [
          'Confirm no blockage on exhaust outlets.',
          'Check fans and filters status.'
        ]
      },
      Powder: {
        mechanism: 'coat',
        checks: [
          { id:'powder_rate',  label:'Powder Rate',   unit:'g/m²', spec:[2, 6] },
          { id:'powder_type',  label:'Powder Type',   unit:'',     spec:[] }, // free text
          { id:'viscosity',    label:'Coating Viscosity', unit:'cP', spec:[20, 35] }
        ],
        tips: [
          'Use the recommended powder for the substrate.',
          'Avoid over-coating to prevent offset elsewhere.'
        ]
      },
      Transport: {
        mechanism: 'transport',
        checks: [
          { id:'pressure',     label:'Nip/Contact Pressure', unit:'N', spec:[50, 80] },
          { id:'roller_clean', label:'Contact Surfaces Clean', unit:'', spec:[] }
        ],
        tips: [
          'Clean contact rollers and check bracket alignment.'
        ]
      }
    },

    // mapping initial branch from triage
    triageBranch: {
      drying:  ['IRD','STS','Transport'],
      coating: ['Powder','Transport'],
      both:    ['IRD','STS','Powder','Transport']
    }
  },

  scratches: {
    code: 'scratches',
    title: 'Scratches',
    description: 'Linear or sporadic scratches on printed media.',
    triage: [
      { id:'pattern', label:'Pattern type', type:'chips',
        options:[ {value:'linear',label:'Linear'}, {value:'random',label:'Random'} ],
        score:{ linear:{contact:0.5, transport:0.3}, random:{contact:0.2, debris:0.5} }
      },
      { id:'side', label:'Which side is affected?', type:'chips',
        options:[ {value:'image',label:'Image area'}, {value:'non',label:'Non-image area'}, {value:'both',label:'Both'} ],
        score:{ image:{contact:0.3}, non:{transport:0.2}, both:{contact:0.2, transport:0.2} }
      }
    ],
    mechanisms: [
      { id:'contact',   title:'Contact / Abrasion' },
      { id:'transport', title:'Transport / Guides' },
      { id:'debris',    title:'Foreign particles / Dust' }
    ],
    subsystems: {
      Blanket: {
        mechanism: 'contact',
        checks: [
          { id:'blanket_wear', label:'Blanket Wear Level', unit:'%', spec:[0, 60] },
          { id:'cleanliness',  label:'Blanket Cleanliness', unit:'',  spec:[] }
        ],
        tips: [ 'Inspect for burrs, resin or damage. Clean with recommended agent.' ]
      },
      Guides: {
        mechanism: 'transport',
        checks: [
          { id:'edge_guides', label:'Edge Guides Condition', unit:'', spec:[] },
          { id:'vacuum',      label:'Vacuum Box Level', unit:'%', spec:[60, 90] }
        ],
        tips: [ 'Deburr/realign guides; verify vacuum uniformity.' ]
      },
      Debris: {
        mechanism: 'debris',
        checks: [
          { id:'filters', label:'Filters Status', unit:'', spec:[] },
          { id:'sheet_dust', label:'Sheet Dust Level', unit:'', spec:[] }
        ],
        tips: [ 'Blow off media path; replace clogged filters.' ]
      }
    },
    triageBranch: { linear:['Blanket','Guides'], random:['Debris','Blanket'], both:['Blanket','Guides','Debris'] }
  },

  uniformity: {
    code:'uniformity',
    title:'Uniformity',
    description:'Density non-uniformity / bands / streaks.',
    triage:[
      { id:'freq', label:'Band frequency', type:'chips',
        options:[ {value:'periodic',label:'Periodic'}, {value:'random',label:'Random'} ],
        score:{ periodic:{registration:0.4, jetting:0.3}, random:{flow:0.3, jetting:0.3} }
      },
      { id:'dir', label:'Direction', type:'chips',
        options:[ {value:'cross',label:'Cross-web'}, {value:'down',label:'Down-web'} ],
        score:{ cross:{flow:0.3}, down:{registration:0.3} }
      }
    ],
    mechanisms:[
      { id:'jetting',       title:'Nozzle / Jetting health' },
      { id:'flow',          title:'Airflow / Drying balance' },
      { id:'registration',  title:'Mechanical / Timing' }
    ],
    subsystems:{
      Heads: { mechanism:'jetting',
        checks:[
          { id:'nozzle_miss', label:'Missing Nozzles (count)', unit:'#', spec:[0, 5] },
          { id:'purge',       label:'Last Purge (min ago)', unit:'min', spec:[0, 60] }
        ],
        tips:[ 'Perform purge and alignment; inspect head temps.' ]
      },
      Drying: { mechanism:'flow',
        checks:[
          { id:'ir_balance', label:'IR Balance Delta', unit:'%', spec:[0, 10] }
        ],
        tips:[ 'Balance drying left/right; avoid strong gradients.' ]
      },
      Timing: { mechanism:'registration',
        checks:[
          { id:'sync', label:'Sync error (µs)', unit:'µs', spec:[-30, 30] }
        ],
        tips:[ 'Run registration routine and recalibrate encoders.' ]
      }
    },
    triageBranch:{ periodic:['Timing','Heads'], random:['Drying','Heads'], cross:['Drying'], down:['Timing'] }
  },

  pq: {
    code:'pq',
    title:'Print Quality (PQ)',
    description:'General print quality issues.',
    triage:[
      { id:'artifact', label:'Main artifact', type:'chips',
        options:[
          { value:'grain', label:'Grain / Mottle' },
          { value:'band',  label:'Banding'       },
          { value:'fade',  label:'Fading'        }
        ],
        score:{ grain:{coat:0.3, flow:0.2}, band:{registration:0.4, jetting:0.3}, fade:{heat:0.3, coat:0.2} }
      }
    ],
    mechanisms:[
      { id:'coat', title:'Coating / Surface prep' },
      { id:'flow', title:'Drying / Balance' },
      { id:'registration', title:'Timing / Mechanics' },
      { id:'jetting', title:'Nozzles / Maintenance' }
    ],
    subsystems:{
      Surface: { mechanism:'coat',
        checks:[
          { id:'roughness', label:'Substrate Roughness', unit:'µm', spec:[0.5, 2.0] },
          { id:'precoat',   label:'Pre-coat presence', unit:'', spec:[] }
        ],
        tips:[ 'Use recommended pre-coat and substrate pair.' ]
      },
      Balance: { mechanism:'flow',
        checks:[
          { id:'delta_lr', label:'Drying L/R Delta', unit:'%', spec:[0, 10] }
        ],
        tips:[ 'Keep left/right within 10%.' ]
      },
      Mechanics: { mechanism:'registration',
        checks:[
          { id:'phase', label:'Phase error', unit:'°', spec:[-2, 2] }
        ],
        tips:[ 'Run calibration routine; verify encoders.' ]
      },
      Maintenance: { mechanism:'jetting',
        checks:[
          { id:'nozzles', label:'Missing Nozzles', unit:'#', spec:[0, 5] }
        ],
        tips:[ 'Purge and wipe; replace if persistent.' ]
      }
    },
    triageBranch:{ grain:['Surface','Balance'], band:['Mechanics','Maintenance'], fade:['Balance','Surface'] }
  }
};
