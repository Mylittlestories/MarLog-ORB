// components/features/entries/CorrectionDialog.jsx
// Destructive-preserving correction: void the original and create a corrected copy
// referencing it, with an optional Master countersignature.
import { useEffect, useState } from 'react'
import { useApp } from '@/store/AppContext.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { TextField } from '@/components/ui/misc.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'

export function CorrectionDialog({ entry, onClose }) {
  const { dispatch } = useApp()
  const [note, setNote] = useState('')
  const [correctedBy, setCorrectedBy] = useState('')
  const [reason, setReason] = useState('')
  const [countersignedBy, setCountersignedBy] = useState('')
  const [countersignDate, setCountersignDate] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setNote(entry.recordOfOperation || '')
    setCorrectedBy(entry.signedBy || '')
  }, [entry])

  const submit = () => {
    setError('')
    if (!note.trim()) { setError('Provide the corrected record of operation.'); return }
    if (!reason.trim()) { setError('Provide the reason for correction.'); return }
    if (!correctedBy.trim()) { setError('Provide who is correcting the entry.'); return }
    dispatch({
      type: 'ADD_CORRECTION',
      payload: {
        entryId: entry.id,
        reason: reason.trim(), correctedBy: correctedBy.trim(),
        countersignedBy: countersignedBy.trim() || null, countersignDate: countersignDate || null,
        corrected: {
          date: entry.date, timeUtc: entry.timeUtc, annex: entry.annex,
          operationCode: entry.operationCode, itemNumber: entry.itemNumber,
          recordOfOperation: note.trim(), tankIds: entry.tankIds, tankId: entry.tankId,
          quantityM3: entry.quantityM3, position: entry.position, speedKnots: entry.speedKnots,
          ppmReading: entry.ppmReading, dischargeOverboard: entry.dischargeOverboard,
          signedBy: correctedBy.trim(), rank: entry.rank || 'Chief Engineer',
        },
      },
    })
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Correct entry #{entry.entryNumber}</DialogTitle>
          <DialogDescription>The original entry will be retained as void and a corrected copy created with a cross-reference. This preserves the audit trail.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Corrected by *" value={correctedBy} onChange={(e) => setCorrectedBy(e.target.value)} placeholder="Officer name" />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Reason for correction *</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. wrong quantity recorded" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">Corrected record of operation *</Label>
            <Textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Countersigned by (Master)" value={countersignedBy} onChange={(e) => setCountersignedBy(e.target.value)} placeholder="Optional" />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">Countersign date</Label>
              <Input type="date" value={countersignDate} onChange={(e) => setCountersignDate(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={submit}>Create corrected entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
