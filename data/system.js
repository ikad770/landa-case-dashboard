// data/systems.js
// Hierarchy for System → SubSystem → HW/SW/EC → Area

window.SYSTEM_HIER = {
  "BSS": {
    subSystems: [
      "LIB","BCU","BCD&BTD Motors","BACS","Fly-Off","Air Knife",
      "Hot Plate","Dancer","BCLS","Vacuum Box"
    ],
    categories: {
      HW: ["Rollers","Sensors","Motors","Brackets","Gaskets","Spare Parts","Pipes","Encoders","Valves"],
      SW: ["LIA","RTC","OPC","Parameters","Inverters Version"],
      EC: ["Inverters","Cables","SSR","CB's","FEC's"]
    },
    areas: [
      "Feeder infeed","Feeder outfeed","Delivery","Print Engine"
    ]
  },

  "Print Engine": {
    subSystems: [
      "Ink Delivery","Imaging","Registration","Blanket","Developer"
    ],
    categories: {
      HW: ["Heads","Pipes","Sensors","Motors","Actuators"],
      SW: ["Algorithms","Parameters","Timing","Color Profiles"],
      EC: ["PSU","Cables","Relays","I/O cards"]
    },
    areas: [
      "Ink Cabinet","Blanket Drum","Registration Zone"
    ]
  },

  "ICS": {
    subSystems: ["ICS SW","ICS HW"],
    categories: {
      HW: ["Cameras","Lights","Brackets"],
      SW: ["Software","Recipes"],
      EC: ["Controllers","Cabling"]
    },
    areas: ["Inspection Bridge","ICS Cabinet"]
  },

  "IRD": {
    subSystems: ["IRD Dryer"],
    categories: {
      HW: ["Emitters","Sensors","Frames"],
      SW: ["Temperature Control","Profiles"],
      EC: ["Power modules","Cables"]
    },
    areas: ["IRD Unit","Exhaust"]
  },

  "STS": {
    subSystems: ["Powder","Vacuum"],
    categories: {
      HW: ["Powder Bar","Hoses"],
      SW: ["Control logic"],
      EC: ["Drives","IO"]
    },
    areas: ["Coater","Delivery"]
  }
};

// Pre-build System list for dropdown
window.SYSTEM_OPTIONS = Object.keys(window.SYSTEM_HIER).map(s => ({
  value: s, label: s
}));
