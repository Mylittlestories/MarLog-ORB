// domain/model.js
// Normalised, multi-vessel data model + migration from the legacy single-vessel shape.
// Pure functions only — no React, no DOM, no storage. Runs in Node (tests) and the browser.
const SCHEMA_VERSION = 3

const nowIso = () => new Date().toISOString()
const uid = (p = 'id') =>
  `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

export const TANK_KINDS = ['slop', 'sludge', 'bilge', 'freshWater', 'ballast', 'fuelOil', 'other']
export const EQUIPMENT_KINDS = ['ows', 'ocm', 'alarm15ppm', 'incinerator', 'odme', 'other']
export const ANNEXES = ['I', 'II', 'V', 'IV']
export const ENTRY_STATUS = ['active', 'corrected', 'void']

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------
export function createVessel({ name = '', imo = '', flagState = '', grossTonnage = 0, vesselType = 'oilTanker' } = {}) {
  return {
    id: uid('vessel'),
    name, imo, flagState, grossTonnage, vesselType,
    annexBooks: ['I'],
    createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null,
  }
}

export function createTank({ vesselId, kind = 'other', name = '', capacityM3 = 0, currentSoundingsM3 = 0, isOperational = true }) {
  return {
    id: uid('tank'), vesselId, kind, name, capacityM3, currentSoundingsM3, isOperational,
    createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null,
  }
}

export function createEquipment({ vesselId, kind = 'ows', model = '', serial = '', capacity = 0, lastCalibrationAt = null, nextCalibrationAt = null }) {
  return {
    id: uid('eq'), vesselId, kind, model, serial, capacity,
    lastCalibrationAt, nextCalibrationAt,
    createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null,
  }
}

export function createCrewMember({ vesselId, name = '', rank = '', licenseNo = '', enabled = true }) {
  return {
    id: uid('crew'), vesselId, name, rank, licenseNo, enabled,
    createdAt: nowIso(), updatedAt: nowIso(), deletedAt: null,
  }
}

/** Legacy entry shape (from v2.1.3) -> normalised v3 entry. */
export function createEntry(payload = {}) {
  const position = { lat: payload.position_lat || '', lon: payload.position_lon || '' }
  return {
    id: payload.id || uid('entry'),
    vesselId: payload.vesselId || payload.vessel_id || '',
    annex: payload.annex || 'I',
    operationCode: payload.operation_code || payload.operationCode || '',
    itemNumber: String(payload.item_number ?? payload.itemNumber ?? ''),
    date: payload.date || '',
    timeUtc: payload.time_utc || payload.timeUtc || '',
    recordOfOperation: payload.record_of_operation || payload.recordOfOperation || '',
    tankIds: payload.tankIds || (payload.tank_id ? [payload.tank_id] : []),
    tankId: payload.tank_id || payload.tankId || '',
    quantityM3: payload.quantity_m3 ?? payload.quantityM3 ?? null,
    position,
    speedKnots: payload.ship_speed_knots ?? payload.speedKnots ?? null,
    heading: payload.heading ?? null,
    ppmReading: payload.ppm_reading ?? payload.ppmReading ?? null,
    alarmStatus: payload.alarm_status ?? payload.alarmStatus ?? '',
    dischargeOverboard: payload.dischargeOverboard ?? false,
    signedBy: payload.signed_by || payload.signedBy || '',
    rank: payload.rank || '',
    countersignedBy: payload.countersignedBy || '',
    countersignDate: payload.countersignDate || '',
    correctedFrom: payload.correctedFrom || null,
    correctedById: payload.correctedById || null,
    voidReason: payload.voidReason || '',
    voidedBy: payload.voidedBy || '',
    voidedAt: payload.voidedAt || null,
    complianceOverride: payload.complianceOverride || null,
    entryNumber: payload.entryNumber ?? null,
    status: payload.status || 'active',
    statusHistory: payload.statusHistory || [{ status: payload.status || 'active', at: nowIso() }],
    createdAt: payload.createdAt || nowIso(),
    updatedAt: nowIso(),
    deletedAt: null,
  }
}

// ---------------------------------------------------------------------------
// Migration: legacy localStorage shape (single vessel) -> v3 store shape
// ---------------------------------------------------------------------------
const defaultVesselShape = {
  vessel_name: '', imo_number: '', flag_state: '', gross_tonnage: 0,
  vessel_type: 'oil_tanker', oily_water_separator_capacity: 0,
  oil_content_monitor_type: '', incinerator_capacity: 0,
  slop_tank_capacity: 0, sludge_tank_capacity: 0, bilge_tank_capacity: 0,
}

/** Convert a legacy v2 payload (as returned by data/initialData.js) into v3 entities. */
export function fromLegacyV2(legacy) {
  const v = legacy?.vessel || {}
  const v3 = defaultVesselShape
  const vessel = createVessel({
    name: v.vessel_name || v3.vessel_name || '',
    imo: v.imo_number || v3.imo_number || '',
    flagState: v.flag_state || v3.flag_state || '',
    grossTonnage: Number(v.gross_tonnage || v3.gross_tonnage || 0),
    vesselType: v.vessel_type === 'oil_tanker' ? 'oilTanker' : 'other',
  })

  // Promote legacy capacities to a tank registry.
  const tanks = []
  const addTank = (kind, name, m3) => {
    if (Number(m3) > 0) tanks.push(createTank({ vesselId: vessel.id, kind, name, capacityM3: Number(m3) }))
  }
  addTank('slop', 'Slop Tank', v.slop_tank_capacity)
  addTank('sludge', 'Sludge Tank', v.sludge_tank_capacity)
  addTank('bilge', 'Bilge Holding Tank', v.bilge_tank_capacity)

  const equipment = []
  if (v.oily_water_separator_capacity)
    equipment.push(createEquipment({ vesselId: vessel.id, kind: 'ows', capacity: Number(v.oily_water_separator_capacity) }))
  if (v.oil_content_monitor_type)
    equipment.push(createEquipment({ vesselId: vessel.id, kind: 'ocm', model: v.oil_content_monitor_type }))
  if (v.incinerator_capacity)
    equipment.push(createEquipment({ vesselId: vessel.id, kind: 'incinerator', capacity: Number(v.incinerator_capacity) }))

  const entries = (legacy?.entries || []).map((e) => createEntry({ ...e, vesselId: vessel.id }))
  const templates = (legacy?.templates || []).map((t) => ({ ...t, vesselId: vessel.id }))

  return {
    schemaVersion: SCHEMA_VERSION,
    activeVesselId: vessel.id,
    vessels: [vessel],
    tanks, equipment, crew: [], templates, entries,
    audit: [], backups: [],
    createdAt: nowIso(),
  }
}

/** Draft empty v3 store for a fresh install. */
export function emptyStore() {
  return fromLegacyV2({})
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function currentVessel(store) {
  return store.vessels.find((v) => v.id === store.activeVesselId) || store.vessels[0] || null
}

export function entriesForVessel(store, vesselId = store.activeVesselId) {
  return store.entries.filter((e) => e.vesselId === vesselId && !e.deletedAt)
}

export function tanksForVessel(store, vesselId = store.activeVesselId) {
  return store.tanks.filter((t) => t.vesselId === vesselId && !t.deletedAt && t.isOperational)
}

export { SCHEMA_VERSION, uid, nowIso }
