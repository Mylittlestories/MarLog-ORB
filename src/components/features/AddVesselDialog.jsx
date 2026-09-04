// components/features/AddVesselDialog.jsx
import { useEffect, useState } from 'react'
import { useApp } from '@/store/AppContext.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog.jsx'
import { Button } from '@/components/ui/button.jsx'
import { TextField } from '@/components/ui/misc.jsx'
import { validateIMO } from '@/lib/utils.js'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { VESSEL_TYPES } from '@/data/catalog.js'

const blank = { name: '', imo: '', flagState: '', grossTonnage: '', vesselType: 'oilTanker' }

export function AddVesselDialog({ open, onOpenChange }) {
  const { dispatch } = useApp()
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})

  useEffect(() => { if (open) { setForm(blank); setErrors({}) } }, [open])

  const submit = (e) => {
    e.preventDefault()
    const e2 = {}
    if (!form.name.trim()) e2.name = 'Vessel name is required'
    if (form.imo && !validateIMO(form.imo)) e2.imo = 'IMO must be 7 digits with a valid check digit'
    if (form.grossTonnage && isNaN(Number(form.grossTonnage))) e2.grossTonnage = 'Must be a number'
    setErrors(e2)
    if (Object.keys(e2).length) return
    dispatch({ type: 'ADD_VESSEL', payload: { name: form.name.trim(), imo: form.imo.trim(), flagState: form.flagState.trim(), grossTonnage: form.grossTonnage ? Number(form.grossTonnage) : 0, vesselType: form.vesselType } })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add vessel</DialogTitle>
          <DialogDescription>Add a new ship to your fleet. You can switch between vessels from the sidebar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <TextField label="Vessel name" htmlFor="av_name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required placeholder="e.g. MT Ocean Pioneer" />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="IMO number" htmlFor="av_imo" value={form.imo} onChange={(e) => setForm({ ...form, imo: e.target.value })} error={errors.imo} maxLength={7} placeholder="7 digits" />
            <TextField label="Flag state" htmlFor="av_flag" value={form.flagState} onChange={(e) => setForm({ ...form, flagState: e.target.value })} placeholder="e.g. Panama" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Gross tonnage" htmlFor="av_gt" type="number" value={form.grossTonnage} onChange={(e) => setForm({ ...form, grossTonnage: e.target.value })} error={errors.grossTonnage} placeholder="e.g. 15000" />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Vessel type</label>
              <Select value={form.vesselType} onValueChange={(v) => setForm({ ...form, vesselType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{VESSEL_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">Add vessel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
