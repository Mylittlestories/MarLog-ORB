// components/features/entries/EntryViewDialog.jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { formatDate, formatPosition } from '@/lib/utils.js'
import { opLabel, OPERATIONS } from '@/data/catalog.js'

const statusVariant = { active: 'success', corrected: 'warning', void: 'destructive' }

export function EntryViewDialog({ entry, onClose }) {
  const op = OPERATIONS[entry.operationCode]
  const rows = [
    ['Entry no.', `#${entry.entryNumber}`],
    ['Date (UTC)', `${formatDate(entry.date)} ${entry.timeUtc}`],
    ['Annex', entry.annex || 'I'],
    ['Operation', opLabel(entry.operationCode, entry.itemNumber)],
    ['Tank / space', entry.tankId || (entry.tankIds && entry.tankIds[0]) || '—'],
    ['Quantity (m³)', entry.quantityM3 ?? '—'],
    ['OCM reading (ppm)', entry.ppmReading ?? '—'],
    ['Discharge overboard', entry.dischargeOverboard ? 'Yes' : 'No'],
    ['Position', entry.position?.lat && entry.position?.lon ? formatPosition(entry.position.lat, entry.position.lon) : '—'],
    ['Speed (knots)', entry.speedKnots ?? '—'],
    ['Signed by', `${entry.signedBy || '—'} (${entry.rank || '—'})`],
  ]
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Entry #{entry.entryNumber} <Badge variant={statusVariant[entry.status] || 'info'}>{entry.status}</Badge></DialogTitle>
          <DialogDescription>{op?.title}</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-slate-100 py-1.5"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-right">{v}</dd></div>
          ))}
        </dl>
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-1 font-medium">Record of operation</p>
          <p className="text-sm bg-slate-50 rounded-lg p-3">{entry.recordOfOperation}</p>
        </div>
        {entry.complianceOverride && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <span className="font-semibold">Compliance override recorded:</span> {entry.complianceOverride.reason} ({formatDate(entry.complianceOverride.at?.slice(0, 10))})
          </div>
        )}
        {(entry.status === 'void') && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800">
            <span className="font-semibold">Original entry voided.</span> Reason: {entry.voidReason || '—'} by {entry.voidedBy || '—'} on {formatDate(entry.voidedAt?.slice(0, 10))}.
          </div>
        )}
        <DialogClose />
      </DialogContent>
    </Dialog>
  )
}
