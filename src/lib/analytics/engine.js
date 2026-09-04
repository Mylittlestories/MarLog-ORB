// analytics/engine.js
// Pure computations over normalised entries. Framework-agnostic and testable.
import { entriesForVessel } from '@/domain/model.js'

const byMonthKey = (entry) => (entry.date || '').slice(0, 7) // YYYY-MM

function numeric(e, key) {
  const v = Number(e[key])
  return Number.isFinite(v) ? v : 0
}

/**
 * Aggregate quantity (m³) per month for the given operation filter.
 * @param {object} store  normalized store
 * @param {object} opts   { operationCode?: string, vesselId?: string }
 */
export function monthlyQuantities(store, opts = {}) {
  const entries = entriesForVessel(store, opts.vesselId)
  const map = {}
  for (const e of entries) {
    if (opts.operationCode && e.operationCode !== opts.operationCode) continue
    const key = byMonthKey(e)
    if (!key) continue
    map[key] = (map[key] || 0) + numeric(e, 'quantityM3')
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    .map(([month, m3]) => ({ month, m3: Number(m3.toFixed(3)) }))
}

/**
 * Waste-management summary over a vessel's entries.
 * @returns {{receivedShore, incinerated, dischargedToSea, balasted, totalOil, byOp:{} }}
 */
export function disposalSummary(store, opts = {}) {
  const entries = entriesForVessel(store, opts.vesselId)
  const summary = {
    receivedShoreM3: 0, incineratedM3: 0, dischargedToSeaM3: 0, ballastReceivedM3: 0,
    totalOilM3: 0, entries: 0, byOp: {},
  }
  for (const e of entries) {
    const q = numeric(e, 'quantityM3')
    summary.entries += 1
    summary.byOp[e.operationCode] = (summary.byOp[e.operationCode] || 0) + q
    summary.totalOilM3 += q
    const item = String(e.itemNumber)
    const overboard = e.dischargeOverboard === true ||
      (e.operationCode === 'D' && item === '3') || (e.operationCode === 'G' && item === '4')
    if (overboard) {
      summary.dischargedToSeaM3 += q
    } else if (e.operationCode === 'E' && (item === '1' || item === '2')) {
      summary.receivedShoreM3 += q
    } else if (e.operationCode === 'E' && item === '3') {
      summary.incineratedM3 += q
    } else if (e.operationCode === 'B') {
      summary.ballastReceivedM3 += q
    }
  }
  // Round
  for (const k of Object.keys(summary)) {
    if (typeof summary[k] === 'number') summary[k] = Number(summary[k].toFixed(3))
  }
  for (const k of Object.keys(summary.byOp)) summary.byOp[k] = Number(summary.byOp[k].toFixed(3))
  return summary
}

/** Sludge generation rate (m³/day) over the whole recorded period. */
export function sludgeGenerationRatePerDay(store, opts = {}) {
  const entries = entriesForVessel(store, opts.vesselId)
    .filter((e) => e.operationCode === 'E' || e.operationCode === 'F')
  if (!entries.length) return 0
  const dates = entries.map((e) => (e.date ? new Date(e.date).getTime() : NaN)).filter(Number.isFinite)
  if (!dates.length) return 0
  const days = (Math.max(...dates) - Math.min(...dates)) / 86400000
  if (days <= 0) return 0
  const total = entries.reduce((s, e) => s + numeric(e, 'quantityM3'), 0)
  return Number((total / days).toFixed(4))
}

/** Disposal efficiency: share of residues handled via reception/incineration (not overboard). */
export function disposalEfficiency(store, opts = {}) {
  const s = disposalSummary(store, opts)
  const handled = s.receivedShoreM3 + s.incineratedM3
  const total = handled + s.dischargedToSeaM3
  if (total === 0) return null
  return Number(((handled / total) * 100).toFixed(1))
}

/** Counts by operation code (for charts / export). */
export function countsByOperation(store, opts = {}) {
  const entries = entriesForVessel(store, opts.vesselId)
  const map = {}
  for (const e of entries) map[e.operationCode] = (map[e.operationCode] || 0) + 1
  return map
}
