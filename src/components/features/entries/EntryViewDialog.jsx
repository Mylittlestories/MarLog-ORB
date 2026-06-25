import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { formatDate, formatPosition } from '@/lib/utils.js'
import { MARPOL_OPERATIONS } from '@/data/marpolOperations.js'

export function EntryViewDialog({ entry, onClose, vessel }) {
  const getOperationName = (code, item) => {
    if (!code) return '—'
    const op = MARPOL_OPERATIONS[code]
    if (!op) return `${code}.${item}`
    return `${op.name} — Item ${item}`
  }

  const infoRows = [
    { label: 'Entry Number', value: `#${entry.entry_number}` },
    { label: 'Date (UTC)', value: formatDate(entry.date) },
    { label: 'Time (UTC)', value: entry.time_utc },
    { label: 'Operation Code', value: entry.operation_code },
    { label: 'Item Number', value: entry.item_number },
    { label: 'Operation', value: getOperationName(entry.operation_code, entry.item_number) },
    { label: 'Tank ID', value: entry.tank_id || '—' },
    { label: 'Quantity', value: entry.quantity_m3 ? `${entry.quantity_m3} m³` : '—' },
    { label: 'Position', value: formatPosition(entry.position_lat, entry.position_lon) },
    { label: 'Speed', value: entry.ship_speed_knots ? `${entry.ship_speed_knots} kts` : '—' },
    { label: 'Signed By', value: entry.signed_by || '—' },
    { label: 'Rank', value: entry.rank || '—' },
  ]

  if (entry.status === 'corrected' || entry.status === 'void') {
    infoRows.push(
      { label: 'Correction Note', value: entry.correction_note || '—' },
      { label: 'Corrected By', value: entry.corrected_by || '—' },
      { label: 'Correction Date', value: formatDate(entry.correction_date) }
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Entry #{entry.entry_number}
            <Badge variant={entry.status === 'corrected' ? 'warning' : entry.status === 'void' ? 'destructive' : 'success'}>{entry.status}</Badge>
          </DialogTitle>
          <DialogDescription>{vessel?.vessel_name} — {vessel?.imo_number}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {infoRows.map((row, i) => (
              <div key={i}>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{row.label}</p>
                <p className="text-sm font-medium mt-0.5">{row.value}</p>
              </div>
            ))}
          </div>
          <Separator />
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Record of Operation</p>
            <div className="bg-slate-50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">{entry.record_of_operation}</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
