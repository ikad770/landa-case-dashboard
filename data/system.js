/* ---------------------------------------------------
   Landa Quantum – System Structure (V20)
--------------------------------------------------- */

window.SYSTEMS = {
  "Feeder": {
    subsystems: {
      "Loader": ["Pallet", "Elevator", "Side Guides"],
      "Vacuum": ["Fans", "Nozzles", "Filters"],
      "Sensors": ["Sheet Sensor", "Jam Sensor", "Skew Sensor"]
    }
  },

  "Print Engine": {
    subsystems: {
      "Imaging": ["Drum", "Laser", "Registration"],
      "Ink Delivery": ["Pipes", "Pumps", "Nano Ink Filters"],
      "Dryer": ["IR Lamps", "Hot Air", "Cooling Fans"]
    }
  },

  "Coater": {
    subsystems: {
      "Varnish": ["Pipes", "Pump", "Tank"],
      "Anilox": ["Roller", "Doctor Blade"],
      "UV": ["UV Lamp", "Power Supply"]
    }
  },

  "IRD": {
    subsystems: {
      "Mass Balance": ["Flow", "Pressure", "Temperature"],
      "Pipes": ["Inlet", "Outlet"],
      "Sensors": ["Temp Sensor", "Level Sensor"]
    }
  },

  "STS": {
    subsystems: {
      "Powder": ["Pump", "Distributor"],
      "Vacuum": ["Filters", "Blower"]
    }
  },

  "ICS / BCU": {
    subsystems: {
      "ICS Software": ["UI", "Database", "Runtime"],
      "ICS Hardware": ["Controllers", "IO Modules"],
      "BCU": ["Power", "Drives"]
    }
  },

  "Other": {
    subsystems: {
      "General": ["N/A"]
    }
  }
};
