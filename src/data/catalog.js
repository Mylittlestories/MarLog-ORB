// data/catalog.js — normalized reference data for the v3 store.
// Operation codes & items are kept as data (editable/extensible later).
export const OPERATIONS = {
  A: { title: 'Crude Oil Washing (COW)', items: { '1': 'Arrival at loading port — tanks to be washed', '2': 'COW started (time, tank numbers, pressure)', '3': 'COW finished (time)', '4': 'Discharge of wash water after COW', '5': 'Departure from loading port' } },
  B: { title: 'Ballasting Operations', items: { '1': 'Ballasting: tanks filled (time, position, tanks ballasted)', '2': 'Ballasting: completed (time, total ballast)', '3': 'Automatic liquid level alarms and visual checks confirmed operational' } },
  C: { title: 'Discharge of Ballast', items: { '1': 'Discharge of ballast water: tanks discharged (time, position, tanks)', '2': 'Discharge to reception facility: time, quantity (m³)', '3': 'Discharge overboard: time, quantity (m³), oil content monitor reading (ppm)', '4': 'Discharge completed (time)' } },
  D: { title: 'Discharge of Oil Residues (Slop)', items: { '1': 'Slop tank(s) and contents recorded', '2': 'Discharge to reception facility: time, quantity (m³)', '3': 'Discharge overboard: time, quantity (m³), oil content monitor reading (ppm)', '4': 'Oil content monitor calibrated and verified at start of discharge', '5': 'Discharge completed, total discharged (m³)' } },
  E: { title: 'Collection, Transfer & Disposal of Oil Residues (Sludge)', items: { '1': 'Sludge transferred to reception facility (time, quantity m³)', '2': 'Sludge transferred to other tank(s) (time, tanks)', '3': 'Sludge incinerated (time, tank, quantity, duration)', '4': 'Other disposal method' } },
  F: { title: 'Non-Automatic Discharge of Oil Residues or Transfer', items: { '1': 'Transfer of oil residues to slop tank(s) (time, tanks, quantity)', '2': 'Transfer from slop tank(s) to another tank(s) (time, tanks, quantity)', '3': 'Discharge to reception facility (time, quantity, tanks emptied)', '4': 'Transfer between tanks for disposal' } },
  G: { title: 'Bilge Water Operations', items: { '1': 'Bilge water accumulated in (tank/space) (time)', '2': 'Bilge water transferred to bilge holding tank (time, tank)', '3': 'Bilge water through 15 ppm separator / to reception facility (time, quantity)', '4': 'Bilge holding tank contents discharged via OWS (time, quantity, ppm reading)', '5': 'Bilge water transferred to another vessel (time, quantity, vessel name)' } },
  H: { title: 'Corrections & Amendments', items: { '1': 'Entry corrected by (name, rank, date)', '2': 'Original entry voided — reason for correction noted', '3': 'Correcting entry cross-referenced with original entry number', '4': 'Master countersignature obtained (date, name)' } },
  I: { title: 'Additional Operations / Equipment Status', items: { '1': 'Oil content monitor tested and calibrated (time, reading)', '2': 'Automatic stopping device tested (time)', '3': 'Slop tank inspection completed (time, findings)', '4': 'Bilge alarm tested (time)', '5': 'Incinerator operation (time, duration, tank emptied)', '6': "Ship's Speed and Heading recorded (time, speed, heading)", '7': 'Position recorded for critical operations' } },
}

export const OPERATION_CODES = Object.keys(OPERATIONS)

export const OPERATION_META = {
  A: { dispatch: 'cargo', label: 'COW' },
  B: { dispatch: 'cargo', label: 'Ballasting' },
  C: { dispatch: 'cargo', label: 'Ballast discharge' },
  D: { dispatch: 'cargo', label: 'Slop discharge' },
  E: { dispatch: 'machinery', label: 'Sludge disposal' },
  F: { dispatch: 'machinery', label: 'Residue transfer' },
  G: { dispatch: 'machinery', label: 'Bilge water' },
  H: { dispatch: 'admin', label: 'Corrections' },
  I: { dispatch: 'machinery', label: 'Equipment/status' },
}

export const VESSEL_TYPES = [
  { value: 'oilTanker', label: 'Oil Tanker (Part I ORB)' },
  { value: 'other', label: 'Non-Oil Tanker / Other Ship (Part II ORB)' },
]

export const RANKS = ['Master', 'Chief Engineer', 'Second Engineer', 'Third Engineer', 'Fourth Engineer', 'Junior Engineer', 'Chief Officer', 'Second Officer', 'Third Officer']

export const TANK_KIND_LABELS = {
  slop: 'Slop tank', sludge: 'Sludge tank', bilge: 'Bilge holding', freshWater: 'Fresh water',
  ballast: 'Ballast', fuelOil: 'Fuel oil', other: 'Other',
}

export const EQUIPMENT_KIND_LABELS = {
  ows: 'Oily water separator (OWS)', ocm: 'Oil content monitor (OCM)', alarm15ppm: '15 ppm alarm',
  incinerator: 'Incinerator', odme: 'ODME', other: 'Other',
}

export const ANNEX_LABELS = { I: 'Annex I — Oil', II: 'Annex II — NLS', IV: 'Annex IV — Sewage', V: 'Annex V — Garbage' }
export const ANNEXES = Object.keys(ANNEX_LABELS)

export const opLabel = (code, item) => {
  const op = OPERATIONS[code]
  if (!op) return `${code || '—'}${item ? `.${item}` : ''}`
  return `${code}) ${op.items[item] || item || op.title}`
}

export const opTitle = (code) => (OPERATIONS[code] ? `${code}) ${OPERATIONS[code].title}` : code || '—')

export const OP_TITLES = Object.fromEntries(Object.entries(OPERATIONS).map(([c, o]) => [c, `${c}) ${o.title.split('(')[0].trim()}`]))
