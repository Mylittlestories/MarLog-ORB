// lib/csvExport.js — spreadsheet-friendly CSV export of entries.
import { opLabel } from '@/data/catalog.js'

function esc(v) {
  if (v == null) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportCSV(entries, vessel) {
  if (!entries.length) return
  const header = ['EntryNo', 'Date', 'TimeUTC', 'Annex', 'OperationCode', 'Item', 'Operation', 'Tank', 'QuantityM3', 'OCM_ppm', 'DischargeOverboard', 'Lat', 'Lon', 'SpeedKnots', 'SignedBy', 'Rank', 'Status', 'Record']
  const rows = entries.map((e) => [
    e.entryNumber, e.date, e.timeUtc, e.annex, e.operationCode, e.itemNumber,
    opLabel(e.operationCode, e.itemNumber), e.tankId || (e.tankIds?.[0] || ''), e.quantityM3,
    e.ppmReading, e.dischargeOverboard ? 'YES' : 'NO', e.position?.lat, e.position?.lon,
    e.speedKnots, e.signedBy, e.rank, e.status, e.recordOfOperation,
  ])
  const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(vessel?.name || 'ORB').replace(/\s+/g, '_')}_entries_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
