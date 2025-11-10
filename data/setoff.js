/* Auto-generated from SetOff Check List.xlsx */
const SET_OFF_DATA = {
  "issue": "SetOff",
  "subsystems": {
    "General": [
      {
        "check": "Issue",
        "spec": []
      },
      {
        "check": "SetOff",
        "spec": []
      }
    ],
    "IRD": [
      {
        "check": "IPU 1",
        "spec": [
          "~25"
        ]
      },
      {
        "check": "IPU 2",
        "spec": [
          "~15"
        ]
      },
      {
        "check": "IPU 3",
        "spec": [
          "~15"
        ]
      },
      {
        "check": "IPU 4",
        "spec": [
          "~15"
        ]
      },
      {
        "check": "IPU 5",
        "spec": [
          "~15"
        ]
      },
      {
        "check": "IPU 6",
        "spec": [
          "~15"
        ]
      },
      {
        "check": "IPU 7",
        "spec": [
          "~15"
        ]
      },
      {
        "check": "Extrusion 8",
        "spec": [
          "7.0-9.0"
        ]
      },
      {
        "check": "Extrusion 9",
        "spec": [
          "7.0-9.0"
        ]
      },
      {
        "check": "Extrusion 10",
        "spec": [
          "7.0-9.0"
        ]
      },
      {
        "check": "Extrusion 11",
        "spec": [
          "7.0-9.0"
        ]
      }
    ]
  }
};
const BRANCH_MAP = { drying: ['IRD','STS','Powder','IRD X'], coating: ['ICS','BCS'], both: Object.keys(SET_OFF_DATA.subsystems) };
