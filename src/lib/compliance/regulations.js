// compliance/regulations.js
// Data-driven MARPOL rule set. Each rule is pure: (entry, ctx) -> finding|null.
// By keeping rules as data, flag-state overrides and regulation versioning are
// additive (see `overrides` note in docs/ADVANCEMENT.md).
import { specialAreaAt, distanceToLandKm, kmToNm } from './specialAreas.js'

export const SEVERITY = {
  INFO: 'info',      // neutral guidance
  WARNING: 'warning',// allowed but flagged; confirm at save
  BLOCKED: 'blocked',// prevented unless explicitly overridden + reason logged
}

const OVERBOARD_ITEMS = {
  // operationCode -> item numbers that represent a discharge to sea
  C: ['3'],    // discharge of ballast water overboard
  D: ['3'],    // discharge slop overboard
  G: ['4'],    // bilge via OWS overboard
}

const isOverboard = (e) => e.dischargeOverboard === true ||
  (OVERBOARD_ITEMS[e.operationCode] || []).includes(e.itemNumber)

const isDischargeOp = (e) => ['C', 'D'].includes(e.operationCode)

export const RULES = [
  {
    id: 'sludge_never_overboard',
    severity: SEVERITY.BLOCKED,
    reference: 'MARPOL 73/78 Annex I Reg 15 (discharge of oil residues)',
    applies: (e, { tanks }) => {
      const sludgeOp = ['E', 'F'].includes(e.operationCode)
      return sludgeOp && isOverboard(e)
    },
    check: () => ({
      message: 'Oil residues (sludge) must NOT be discharged overboard. Use a shore/port reception facility or incineration.',
    }),
  },
  {
    id: 'ppm_15_limit',
    severity: SEVERITY.BLOCKED,
    reference: 'MARPOL 73/78 Annex I Reg 15.3 (15 ppm oil content)',
    applies: (e) => isOverboard(e) && e.ppmReading != null && Number(e.ppmReading) > 15,
    check: (e) => ({
      message: `OCM reading ${e.ppmReading} ppm exceeds the 15 ppm limit for overboard discharge.`,
    }),
  },
  {
    id: 'ppm_reading_required',
    severity: SEVERITY.WARNING,
    reference: 'MARPOL 73/78 Annex I Reg 15.3',
    applies: (e) => isOverboard(e) && (e.ppmReading == null || e.ppmReading === ''),
    check: () => ({
      message: 'An oil content monitor reading (ppm) should be recorded for every overboard discharge.',
    }),
  },
  {
    id: 'en_route_required',
    severity: SEVERITY.WARNING,
    reference: 'MARPOL 73/78 Annex I Reg 15.2 (ship en route)',
    applies: (e) => isOverboard(e) && (e.speedKnots == null || Number(e.speedKnots) <= 0),
    check: () => ({
      message: 'Overboard discharge should take place while the ship is en route (speed > 0). No speed recorded.',
    }),
  },
  {
    id: 'position_required_discharge',
    severity: SEVERITY.BLOCKED,
    reference: 'MARPOL 73/78 Annex I Reg 15',
    applies: (e) => isOverboard(e) && (!e.position || !e.position.lat || !e.position.lon),
    check: () => ({
      message: 'Position (latitude and longitude) is required to verify special-area and distance-from-land discharge rules.',
    }),
  },
  {
    id: 'special_area_discharge',
    severity: SEVERITY.WARNING,
    reference: 'MARPOL 73/78 Annex I Reg 15.6 & Annex V Reg 7 (special areas)',
    applies: (e, ctx) => isOverboard(e) && ctx.specialArea != null,
    check: (e, ctx) => ({
      message: `Overboard discharge recorded inside the ${ctx.specialArea.name} special area. Verify this discharge is permitted.`,
    }),
  },
  {
    id: 'distance_12nm',
    severity: SEVERITY.WARNING,
    reference: 'MARPOL 73/78 Annex I Reg 15.2 (not within 12 nm of nearest land)',
    applies: (e, ctx) => isOverboard(e) && ctx.distanceToLandNm != null && ctx.distanceToLandNm < 12,
    check: (e, ctx) => ({
      message: `Estimated ${ctx.distanceToLandNm.toFixed(1)} nm from nearest land — discharge within 12 nm is not permitted.`,
    }),
  },
  {
    id: 'ballast_special_area',
    severity: SEVERITY.WARNING,
    reference: 'MARPOL 73/78 Annex I Reg 18 (ballast water ops in special areas)',
    applies: (e, ctx) => e.operationCode === 'C' && ctx.specialArea != null,
    check: (e, ctx) => ({
      message: `Ballast water operation recorded inside the ${ctx.specialArea.name} special area. Confirm compliance.`,
    }),
  },
  {
    id: 'tank_capacity_exceeded',
    severity: SEVERITY.BLOCKED,
    reference: 'Vessel tank capacity',
    applies: (e, ctx) => e.quantityM3 != null && e.quantityM3 > 0 && ctx.targetTank && Number(e.quantityM3) > Number(ctx.targetTank.capacityM3),
    check: (e, ctx) => ({
      message: `Quantity ${e.quantityM3} m³ exceeds ${ctx.targetTank.name} capacity (${ctx.targetTank.capacityM3} m³).`,
    }),
  },
  {
    id: 'calibration_overdue',
    severity: SEVERITY.INFO,
    reference: 'OCM/OWS calibration per SMS',
    applies: (e, ctx) => ctx.equipment.some((q) => q.nextCalibrationAt && new Date(q.nextCalibrationAt) < new Date()),
    check: () => ({
      message: 'One or more pieces of oil/water equipment have an overdue calibration date. Verify before recording the reading.',
    }),
  },
  {
    id: 'countersignature_correction',
    severity: SEVERITY.WARNING,
    reference: 'MARPOL 73/78 Annex I Reg 17.3 (corrections countersigned)',
    applies: (e) => e.status === 'corrected' && !(e.countersignedBy && e.countersignDate),
    check: () => ({
      message: 'Corrections should be countersigned by the Master (name and date).',
    }),
  },
]

/**
 * Run the compliance engine for a single entry.
 * @param {object} entry  normalised entry (see domain/model.js)
 * @param {object} context { tanks:[], equipment:[], position?, specialArea?, distanceToLandNm? }
 * @returns { findings:[{ruleId,severity,message,reference}], worstSeverity }
 */
export function validateEntry(entry, context = {}) {
  const tanks = context.tanks || []
  const position = entry.position && (entry.position.lat || entry.position.lon)
    ? entry.position
    : context.position

  const ctx = {
    positional: position || null,
    get position() { return this.positional },
    distanceToLandNm: kmToNm(distanceToLandKm(position)),
    specialArea: specialAreaAt(position),
    targetTank: null,
    equipment: context.equipment || [],
    tanks,
  }

  // Resolve target tank (by ids, or by free-text name match).
  if (tanks.length && (entry.tankIds?.length || entry.tankId)) {
    const id = entry.tankIds?.[0] || entry.tankId
    const byId = tanks.find((t) => t.id === id)
    const byName = tanks.find((t) => t.name === id)
    ctx.targetTank = byId || byName || null
  }

  const findings = []
  for (const rule of RULES) {
    try {
      if (!rule.applies(entry, ctx)) continue
      const f = rule.check(entry, ctx)
      // allow rule.check to return a severity; default to rule.severity
      const severity = f && f.severity ? f.severity : rule.severity
      findings.push({ ruleId: rule.id, severity, message: f?.message || '', reference: rule.reference })
    } catch (err) {
      // never let a rule throw and block the form
      findings.push({ ruleId: rule.id, severity: SEVERITY.INFO, message: `Rule ${rule.id} error: ${err.message}`, reference: rule.reference })
    }
  }

  const order = { [SEVERITY.BLOCKED]: 3, [SEVERITY.WARNING]: 2, [SEVERITY.INFO]: 1, '': 0 }
  const worst = findings.reduce((acc, f) => (order[f.severity] > order[acc] ? f.severity : acc), '')
  return { findings, worstSeverity: worst }
}

export const severityLabel = (s) => (s === SEVERITY.BLOCKED ? 'Blocked' : s === SEVERITY.WARNING ? 'Warning' : s === SEVERITY.INFO ? 'Info' : 'OK')
