// store/store.js
// v3 normalized store: reducer + selectors + audit + correction model.
// Pure functions (no React, no DOM) so they are testable in Node.
import {
  SCHEMA_VERSION, createVessel, createTank, createEquipment, createCrewMember,
  createEntry, fromLegacyV2, emptyStore, uid,
} from '@/domain/model.js'

export const STATUS = { ACTIVE: 'active', CORRECTED: 'corrected', VOID: 'void' }

const nowIso = () => new Date().toISOString()

// --- audit ----------------------------------------------------------------
function withAudit(state, actor, action, entity, entityId, detail = {}) {
  if (!state.auditEnabled) return state
  const record = {
    id: uid('audit'), at: nowIso(), actor: actor || 'unknown',
    action, entity, entityId, detail: JSON.stringify(detail),
  }
  return { ...state, audit: [record, ...state.audit].slice(0, 500) }
}

// --- update helpers --------------------------------------------------------
const updateIn = (arr, id, patch, actor) => arr.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: nowIso() } : x))
const deleted = (x) => ({ ...x, deletedAt: nowIso(), updatedAt: nowIso() })

function nextEntryNumber(state, vesselId) {
  const nums = state.entries
    .filter((e) => e.vesselId === vesselId && !e.deletedAt)
    .map((e) => Number(e.entryNumber) || 0)
  return (nums.length ? Math.max(...nums) : 0) + 1
}

// --- reducer ----------------------------------------------------------------
export function reducer(state, action) {
  const actor = action.actor || 'local'
  const vesselId = action.vesselId || state.activeVesselId

  switch (action.type) {
    case 'LOAD_STORE':
      return action.payload

    case 'SET_ACTIVE_VESSEL':
      return { ...state, activeVesselId: action.payload.uid, updatedAt: nowIso() }

    case 'ADD_VESSEL': {
      const v = createVessel(action.payload)
      const s = { ...state, vessels: [...state.vessels, v], activeVesselId: v.id, updatedAt: nowIso() }
      return withAudit(s, actor, 'created', 'vessel', v.id, { name: v.name })
    }
    case 'UPDATE_VESSEL':
      return withAudit(
        { ...state, vessels: updateIn(state.vessels, action.payload.id, action.payload), updatedAt: nowIso() },
        actor, 'updated', 'vessel', action.payload.id,
      )
    case 'DELETE_VESSEL':
      return withAudit(
        { ...state, vessels: state.vessels.map((v) => (v.id === action.payload.id ? deleted(v) : v)), updatedAt: nowIso() },
        actor, 'deleted', 'vessel', action.payload.id,
      )

    case 'ADD_TANK': {
      const t = createTank({ ...action.payload, vesselId })
      return withAudit({ ...state, tanks: [...state.tanks, t], updatedAt: nowIso() }, actor, 'created', 'tank', t.id, { name: t.name })
    }
    case 'UPDATE_TANK':
      return withAudit(
        { ...state, tanks: updateIn(state.tanks, action.payload.id, action.payload), updatedAt: nowIso() },
        actor, 'updated', 'tank', action.payload.id,
      )
    case 'DELETE_TANK':
      return withAudit(
        { ...state, tanks: state.tanks.map((t) => (t.id === action.payload.id ? deleted(t) : t)), updatedAt: nowIso() },
        actor, 'deleted', 'tank', action.payload.id,
      )

    case 'ADD_EQUIPMENT': {
      const eq = createEquipment({ ...action.payload, vesselId })
      return withAudit({ ...state, equipment: [...state.equipment, eq], updatedAt: nowIso() }, actor, 'created', 'equipment', eq.id, { kind: eq.kind })
    }
    case 'UPDATE_EQUIPMENT':
      return withAudit(
        { ...state, equipment: updateIn(state.equipment, action.payload.id, action.payload), updatedAt: nowIso() },
        actor, 'updated', 'equipment', action.payload.id,
      )
    case 'DELETE_EQUIPMENT':
      return withAudit(
        { ...state, equipment: state.equipment.map((e) => (e.id === action.payload.id ? deleted(e) : e)), updatedAt: nowIso() },
        actor, 'deleted', 'equipment', action.payload.id,
      )

    case 'ADD_CREW': {
      const c = createCrewMember({ ...action.payload, vesselId })
      return withAudit({ ...state, crew: [...state.crew, c], updatedAt: nowIso() }, actor, 'created', 'crew', c.id, { name: c.name })
    }
    case 'UPDATE_CREW':
      return withAudit(
        { ...state, crew: updateIn(state.crew, action.payload.id, action.payload), updatedAt: nowIso() },
        actor, 'updated', 'crew', action.payload.id,
      )
    case 'DELETE_CREW':
      return withAudit(
        { ...state, crew: state.crew.map((c) => (c.id === action.payload.id ? deleted(c) : c)), updatedAt: nowIso() },
        actor, 'deleted', 'crew', action.payload.id,
      )

    case 'ADD_ENTRY': {
      const e = createEntry({ ...action.payload, vesselId })
      const withNum = { ...e, entryNumber: nextEntryNumber(state, vesselId) }
      const s = { ...state, entries: [withNum, ...state.entries], updatedAt: nowIso() }
      return withAudit(s, actor, 'created', 'entry', withNum.id, { n: withNum.entryNumber, op: withNum.operationCode })
    }

    case 'UPDATE_ENTRY': {
      const s = { ...state, entries: updateIn(state.entries, action.payload.id, action.payload), updatedAt: nowIso() }
      return withAudit(s, actor, 'edited', 'entry', action.payload.id)
    }

    // Destructive-preserving correction: void original + create corrected copy.
    case 'ADD_CORRECTION': {
      const { entryId, corrected: newEntryData, reason, correctedBy, countersignedBy, countersignDate } = action.payload
      const original = state.entries.find((e) => e.id === entryId)
      if (!original) return state

      const currentNum = Number(original.entryNumber) || nextEntryNumber(state, vesselId)
      const voided = {
        ...original, status: STATUS.VOID, updatedAt: nowIso(),
        statusHistory: [...(original.statusHistory || []), { status: STATUS.VOID, at: nowIso() }],
        voidReason: reason, voidedBy: correctedBy, voidedAt: nowIso(),
        correctedById: null, // set below after new entry id known
      }

      const corrected = createEntry({
        ...newEntryData, vesselId: original.vesselId, annex: original.annex,
        correctedFrom: entryId, countersignedBy, countersignDate,
      })
      const correctedWithNum = { ...corrected, entryNumber: nextEntryNumber(state, vesselId) }
      const voidedWithRef = { ...voided, correctedById: correctedWithNum.id }

      const s = {
        ...state,
        entries: [correctedWithNum, ...state.entries.map((e) => (e.id === entryId ? voidedWithRef : e))],
        updatedAt: nowIso(),
      }
      return withAudit(s, actor, 'corrected', 'entry', correctedWithNum.id, { from: entryId, reason })
    }

    case 'ADD_TEMPLATE': {
      const t = { id: uid('tpl'), ...action.payload, vesselId, useCount: 0, createdAt: nowIso(), updatedAt: nowIso() }
      return withAudit({ ...state, templates: [...state.templates, t], updatedAt: nowIso() }, actor, 'created', 'template', t.id, { name: t.name })
    }
    case 'UPDATE_TEMPLATE':
      return withAudit(
        { ...state, templates: state.templates.map((t) => (t.id === action.payload.id ? { ...t, ...action.payload, updatedAt: nowIso() } : t)), updatedAt: nowIso() },
        actor, 'updated', 'template', action.payload.id,
      )
    case 'DELETE_TEMPLATE':
      return withAudit(
        { ...state, templates: state.templates.filter((t) => t.id !== action.payload.id), updatedAt: nowIso() },
        actor, 'deleted', 'template', action.payload.id,
      )
    case 'INCREMENT_TEMPLATE_USAGE':
      return { ...state, templates: state.templates.map((t) => (t.id === action.payload ? { ...t, useCount: (t.useCount || 0) + 1 } : t)) }

    case 'IMPORT':
      return { ...action.payload, auditEnabled: state.auditEnabled, updatedAt: nowIso() }
    case 'CLEAR_ALL':
      return { ...emptyStore(), auditEnabled: state.auditEnabled }

    default:
      return state
  }
}

export function createInitialStore(legacy) {
  const base = legacy ? fromLegacyV2(legacy) : emptyStore()
  base.auditEnabled = true
  // seed default templates for the single vessel if none exist
  if (!base.templates.length) {
    base.templates = defaultTemplates().map((t) => ({ ...t, vesselId: base.activeVesselId, id: uid('tpl'), useCount: 0, createdAt: nowIso(), updatedAt: nowIso() }))
  }
  return base
}

export function defaultTemplates() {
  return [
    { name: 'Routine Bilge Discharge via OWS', description: 'Bilge water overboard through 15 ppm separator while at sea', operationCode: 'G', itemNumber: '4', recordOfOperation: 'Bilge water from bilge holding tank discharged via OWS overboard. Oil content monitor reading: [READING] ppm. Alarm status: [ALARM]. Total quantity: [QUANTITY] m³.', rank: 'Chief Engineer', tankRef: 'Bilge Holding Tank' },
    { name: 'Ballast Water — Taking On', description: 'Ballast taken on for voyage stability', operationCode: 'B', itemNumber: '1', recordOfOperation: 'Ballast water taken on for voyage stability. Tanks ballasted: [TANKS]. Total quantity received: [QUANTITY] m³.', rank: 'Chief Officer', tankRef: '' },
    { name: 'Sludge to Reception Facility', description: 'Transfer of sludge residues to a port reception facility', operationCode: 'E', itemNumber: '1', recordOfOperation: 'Sludge from sludge tank transferred to shore reception facility. Quantity: [QUANTITY] m³. Tank(s) emptied: [TANKS].', rank: 'Chief Engineer', tankRef: '' },
    { name: 'Bilge Water to Reception Facility', description: 'Discharge bilge water to a port reception facility', operationCode: 'G', itemNumber: '3', recordOfOperation: 'Bilge water transferred to port reception facility. Quantity: [QUANTITY] m³. Tank(s) emptied: [TANKS].', rank: 'Chief Engineer', tankRef: '' },
    { name: 'Oil Content Monitor Calibration', description: 'Record OCM calibration and verification', operationCode: 'I', itemNumber: '1', recordOfOperation: 'Oil content monitor calibrated and verified operational. Test reading: [READING] ppm (expected <15 ppm). 15 ppm alarm tested and confirmed functional.', rank: 'Chief Engineer', tankRef: '' },
    { name: 'Slop Tank Transfer', description: 'Transfer oil residues between slop tanks', operationCode: 'F', itemNumber: '2', recordOfOperation: 'Oil residues transferred from [SOURCE TANK] to [DESTINATION TANK]. Quantity transferred: [QUANTITY] m³.', rank: 'Chief Engineer', tankRef: '' },
  ]
}

// --- selectors --------------------------------------------------------------
export const currentVessel = (s) => s.vessels.find((v) => v.id === s.activeVesselId) || s.vessels[0] || null
export const entriesFor = (s, vid = s.activeVesselId) =>
  s.entries.filter((e) => e.vesselId === vid && !e.deletedAt).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || (Number(b.entryNumber) - Number(a.entryNumber)))
export const tanksFor = (s, vid = s.activeVesselId) => s.tanks.filter((t) => t.vesselId === vid && !t.deletedAt && t.isOperational !== false)
export const equipmentFor = (s, vid = s.activeVesselId) => s.equipment.filter((e) => e.vesselId === vid && !e.deletedAt)
export const crewFor = (s, vid = s.activeVesselId) => s.crew.filter((c) => c.vesselId === vid && !c.deletedAt && c.enabled !== false)
export const templatesFor = (s, vid = s.activeVesselId) => s.templates.filter((t) => (!t.vesselId || t.vesselId === vid))

export function vesselSummary(s) {
  const vessel = currentVessel(s)
  if (!vessel) return null
  const entries = entriesFor(s, vessel.id)
  const active = entries.filter((e) => e.status === STATUS.ACTIVE)
  const now = new Date()
  const thisMonth = entries.filter((e) => {
    if (!e.date) return false
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  return { vessel, total: entries.length, active: active.length, corrected: entries.filter((e) => e.status === STATUS.CORRECTED).length, voided: entries.filter((e) => e.status === STATUS.VOID).length, thisMonth: thisMonth.length, tanks: tanksFor(s, vessel.id).length }
}
