import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'

export function CorrectionDialog({ entry, onClose, onCorrect }) {
  const [correctionNote, setCorrectionNote] = useState('')
  const [correctedBy, setCorrectedBy] = useState('')
  const [correctionDate, setCorrectionDate] = useState(new Date().toISOString().split('T')[0])
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!correctionNote.trim()) newErrors.correctionNote = 'Correction note is required'
    if (!correctedBy.trim()) newErrors.correctedBy = 'Corrector name is required'
    if (!correctionDate) newErrors.correctionDate = 'Date is required'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    onCorrect({ entryId: entry.id, correctionNote, correctedBy, correctionDate })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Correct Entry #{entry.entry_number}
          </DialogTitle>
          <DialogDescription>
            Per MARPOL requirements, corrections must be clearly marked, never obliterated.
            The original entry remains legible and the correction is signed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
            <p className="font-medium text-amber-900">Original Entry</p>
            <p className="text-amber-700 mt-1 line-clamp-3">{entry.record_of_operation}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="correctionNote">Correction Note *</Label>
            <Textarea id="correctionNote" value={correctionNote} onChange={(e) => setCorrectionNote(e.target.value)} placeholder="Describe what was corrected and why..." rows={3} className={errors.correctionNote ? 'border-red-500' : ''} />
            {errors.correctionNote && <p className="text-xs text-red-500">{errors.correctionNote}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="correctedBy">Corrected By *</Label>
              <Input id="correctedBy" value={correctedBy} onChange={(e) => setCorrectedBy(e.target.value)} placeholder="Officer name" className={errors.correctedBy ? 'border-red-500' : ''} />
              {errors.correctedBy && <p className="text-xs text-red-500">{errors.correctedBy}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="correctionDate">Date *</Label>
              <Input id="correctionDate" type="date" value={correctionDate} onChange={(e) => setCorrectionDate(e.target.value)} className={errors.correctionDate ? 'border-red-500' : ''} />
              {errors.correctionDate && <p className="text-xs text-red-500">{errors.correctionDate}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Apply Correction</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
