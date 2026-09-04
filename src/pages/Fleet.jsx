// pages/Fleet.jsx — vessel profile + tanks + equipment + crew setup.
import { useState } from 'react'
import { useApp } from '@/store/AppContext.jsx'
import { currentVessel, tanksFor, equipmentFor, crewFor } from '@/lib/store.js'
import { PageHeader, Field, EmptyState, ConfirmDialog } from '@/components/ui/misc.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Toast } from '@/components/ui/toast.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog.jsx'
import { Ship, Plus, Trash2, PenLine, Save, ToggleLeft, Users, Wrench } from 'lucide-react'
import { VESSEL_TYPES, TANK_KIND_LABELS, EQUIPMENT_KIND_LABELS, RANKS } from '@/data/catalog.js'
import { validateIMO } from '@/lib/utils.js'
import { uid } from '@/domain/model.js'

export function Fleet() {
  const { state, dispatch } = useApp()
  const vessel = currentVessel(state)
  const tanks = tanksFor(state, vessel?.id)
  const equipment = equipmentFor(state, vessel?.id)
  const crew = crewFor(state, vessel?.id)
  const [tab, setTab] = useState('vessel')
  const [toast, setToast] = useState(null)
  const [editObj, setEditObj] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 3000) }

  if (!vessel) return <EmptyState icon={Ship} title="No vessel set" hint="Add a vessel from the sidebar" />

  const tabs = [
    { id: 'vessel', label: 'Vessel', icon: Ship },
    { id: 'tanks', label: 'Tanks', icon: ToggleLeft },
    { id: 'equipment', label: 'Equipment', icon: Wrench },
    { id: 'crew', label: 'Crew', icon: Users },
  ]

  return (
    <div className="space-y-4">
      <PageHeader icon={Ship} title="Fleet Setup" subtitle={vessel.name} />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border ${tab === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'vessel' && <VesselForm vessel={vessel} onSaved={() => showToast('Vessel profile saved')} />}
      {tab === 'tanks' && <TanksTab tanks={tanks} vesselId={vessel.id} dispatch={dispatch} onEdit={setEditObj} onDelete={setDeleteId} showToast={showToast} />}
      {tab === 'equipment' && <EquipmentTab equipment={equipment} vesselId={vessel.id} dispatch={dispatch} onEdit={setEditObj} onDelete={setDeleteId} showToast={showToast} />}
      {tab === 'crew' && <CrewTab crew={crew} vesselId={vessel.id} dispatch={dispatch} onEdit={setEditObj} onDelete={setDeleteId} showToast={showToast} />}

      {(tanks.length || equipment.length || crew.length) && (
        <p className="text-xs text-slate-400">Set up tanks, equipment and crew to get type-ahead selection, capacity checks and calibration reminders in your entries.</p>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete item?" description="This item will be hidden (soft delete) and remain in history." onConfirm={() => { deleteItem(tab, deleteId, dispatch); setDeleteId(null) }} />
    </div>
  )
}

function deleteItem(tab, id, dispatch) {
  const map = { tanks: 'DELETE_TANK', equipment: 'DELETE_EQUIPMENT', crew: 'DELETE_CREW' }
  if (map[tab]) dispatch({ type: map[tab], payload: { id } })
}

// --- vessel -----------------------------------------------------------------
function VesselForm({ vessel, onSaved }) {
  const { dispatch } = useApp()
  const [f, setF] = useState({
    name: vessel.name || '', imo: vessel.imo || '', flagState: vessel.flagState || '',
    grossTonnage: vessel.grossTonnage || '', vesselType: vessel.vesselType || 'oilTanker',
  })
  const [err, setErr] = useState({})
  const [saved, setSaved] = useState(false)
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); setErr((x) => ({ ...x, [k]: null })) }
  const submit = (e) => {
    e.preventDefault()
    const ee = {}
    if (!f.name.trim()) ee.name = 'Required'
    if (f.imo && !validateIMO(f.imo)) ee.imo = 'IMO must be 7 digits with valid check digit'
    if (f.grossTonnage && isNaN(Number(f.grossTonnage))) ee.grossTonnage = 'Must be a number'
    setErr(ee)
    if (Object.keys(ee).length) return
    dispatch({ type: 'UPDATE_VESSEL', payload: { id: vessel.id, name: f.name.trim(), imo: f.imo.trim(), flagState: f.flagState.trim(), grossTonnage: f.grossTonnage ? Number(f.grossTonnage) : 0, vesselType: f.vesselType } })
    setSaved(true); onSaved(); setTimeout(() => setSaved(false), 2000)
  }
  return (
    <form onSubmit={submit} className="rounded-xl border bg-white p-5 space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Vessel name *" error={err.name}><Input value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="IMO number" error={err.imo}><Input value={f.imo} onChange={(e) => set('imo', e.target.value)} maxLength={7} placeholder="7 digits" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Flag state"><Input value={f.flagState} onChange={(e) => set('flagState', e.target.value)} /></Field>
        <Field label="Gross tonnage" error={err.grossTonnage}><Input type="number" value={f.grossTonnage} onChange={(e) => set('grossTonnage', e.target.value)} /></Field>
      </div>
      <Field label="Vessel type" required>
        <Select value={f.vesselType} onValueChange={(v) => set('vesselType', v)}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{VESSEL_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <div className="flex items-center gap-2"><Button type="submit"><Save className="w-4 h-4 mr-2" />{saved ? 'Saved!' : 'Save profile'}</Button>{saved && <span className="text-sm text-green-600">✓ Updated</span>}</div>
    </form>
  )
}

// --- tanks ------------------------------------------------------------------
function TanksTab({ tanks, vesselId, dispatch, onEdit, onDelete, showToast }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(() => blank())
  const blank = () => ({ id: '', vesselId, kind: 'slop', name: '', capacityM3: '', currentSoundingsM3: '', isOperational: true })
  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) { showToast('Tank name required'); return }
    const payload = { id: form.id || uid('tank'), kind: form.kind, name: form.name.trim(), vesselId: form.vesselId || vesselId, capacityM3: Number(form.capacityM3) || 0, currentSoundingsM3: Number(form.currentSoundingsM3) || 0, isOperational: form.isOperational }
    dispatch({ type: form.id ? 'UPDATE_TANK' : 'ADD_TANK', payload })
    setOpen(false)
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button size="sm" onClick={() => { setForm(blank()); setOpen(true) }}><Plus className="w-4 h-4 mr-2" /> Add tank</Button></div>
      {tanks.length === 0
        ? <EmptyState icon={ToggleLeft} title="No tanks configured" hint="Add slop, sludge, bilge and ballast tanks for this vessel" />
        : <div className="rounded-xl border bg-white overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Kind</TableHead><TableHead>Capacity (m³)</TableHead><TableHead>Soundings (m³)</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{tanks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell><Badge variant="outline">{TANK_KIND_LABELS[t.kind] || t.kind}</Badge></TableCell>
                  <TableCell>{t.capacityM3}</TableCell>
                  <TableCell>{t.currentSoundingsM3}</TableCell>
                  <TableCell><div className="flex gap-1">{t.isOperational !== false && <Button variant="ghost" size="icon" onClick={() => { setForm({ id: t.id, vesselId, kind: t.kind, name: t.name, capacityM3: t.capacityM3, currentSoundingsM3: t.currentSoundingsM3, isOperational: t.isOperational !== false }); setOpen(true) }}><PenLine className="w-4 h-4" /></Button>}<Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(t.id)}><Trash2 className="w-4 h-4" /></Button></div></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Tank</DialogTitle><DialogDescription>Capacities enable quantity checks in entries.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. No.1 Slop Tank" /></Field>
            <Field label="Kind"><Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TANK_KIND_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Capacity (m³)"><Input type="number" min="0" value={form.capacityM3} onChange={(e) => setForm({ ...form, capacityM3: e.target.value })} /></Field>
              <Field label="Current (m³)"><Input type="number" min="0" value={form.currentSoundingsM3} onChange={(e) => setForm({ ...form, currentSoundingsM3: e.target.value })} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isOperational} onChange={(e) => setForm({ ...form, isOperational: e.target.checked })} className="h-4 w-4" />Operational</label>
            <DialogFooter className="gap-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- equipment --------------------------------------------------------------
function EquipmentTab({ equipment, vesselId, dispatch, onDelete, showToast }) {
  const [open, setOpen] = useState(false)
  const blank = () => ({ id: '', vesselId, kind: 'ows', model: '', serial: '', capacity: '', lastCalibrationAt: '', nextCalibrationAt: '' })
  const [form, setForm] = useState(blank)
  const submit = (e) => {
    e.preventDefault()
    dispatch({ type: form.id ? 'UPDATE_EQUIPMENT' : 'ADD_EQUIPMENT', payload: { id: form.id || uid('eq'), vesselId: form.vesselId || vesselId, kind: form.kind, model: form.model, serial: form.serial, capacity: Number(form.capacity) || 0, lastCalibrationAt: form.lastCalibrationAt || null, nextCalibrationAt: form.nextCalibrationAt || null } })
    setOpen(false)
  }
  const overdue = (e) => e.nextCalibrationAt && new Date(e.nextCalibrationAt) < new Date()
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button size="sm" onClick={() => { setForm(blank()); setOpen(true) }}><Plus className="w-4 h-4 mr-2" /> Add equipment</Button></div>
      {equipment.length === 0
        ? <EmptyState icon={Wrench} title="No equipment configured" hint="Add OWS, OCM, 15 ppm alarm, incinerator, ODME" />
        : <div className="rounded-xl border bg-white overflow-x-auto">
            <Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Model</TableHead><TableHead>Serial</TableHead><TableHead>Capacity</TableHead><TableHead>Next calibration</TableHead><TableHead className="w-16">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{equipment.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{EQUIPMENT_KIND_LABELS[e.kind] || e.kind}</TableCell>
                <TableCell>{e.model || '—'}</TableCell><TableCell>{e.serial || '—'}</TableCell><TableCell>{e.capacity || '—'}</TableCell>
                <TableCell>{e.nextCalibrationAt ? <Badge variant={overdue(e) ? 'destructive' : 'success'}>{e.nextCalibrationAt}{overdue(e) ? ' overdue' : ''}</Badge> : '—'}</TableCell>
                <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => { setForm({ id: e.id, vesselId, kind: e.kind, model: e.model, serial: e.serial, capacity: e.capacity, lastCalibrationAt: e.lastCalibrationAt || '', nextCalibrationAt: e.nextCalibrationAt || '' }); setOpen(true) }}><PenLine className="w-4 h-4" /></Button><Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(e.id)}><Trash2 className="w-4 h-4" /></Button></div></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </div>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Equipment</DialogTitle><DialogDescription>Set next calibration date for automatic reminders.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Type"><Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EQUIPMENT_KIND_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></Field>
            <div className="grid grid-cols-2 gap-4"><Field label="Model"><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></Field><Field label="Serial"><Input value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} /></Field></div>
            <Field label="Capacity"><Input type="number" min="0" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-4"><Field label="Last calibration"><Input type="date" value={form.lastCalibrationAt} onChange={(e) => setForm({ ...form, lastCalibrationAt: e.target.value })} /></Field><Field label="Next calibration"><Input type="date" value={form.nextCalibrationAt} onChange={(e) => setForm({ ...form, nextCalibrationAt: e.target.value })} /></Field></div>
            <DialogFooter className="gap-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- crew -------------------------------------------------------------------
function CrewTab({ crew, vesselId, dispatch, onDelete, showToast }) {
  const [open, setOpen] = useState(false)
  const blank = () => ({ id: '', vesselId, name: '', rank: 'Chief Engineer', licenseNo: '', enabled: true })
  const [form, setForm] = useState(blank)
  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) { showToast('Name required'); return }
    dispatch({ type: form.id ? 'UPDATE_CREW' : 'ADD_CREW', payload: { id: form.id || uid('crew'), vesselId: form.vesselId || vesselId, name: form.name.trim(), rank: form.rank, licenseNo: form.licenseNo, enabled: form.enabled } })
    setOpen(false)
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button size="sm" onClick={() => { setForm(blank()); setOpen(true) }}><Plus className="w-4 h-4 mr-2" /> Add crew member</Button></div>
      {crew.length === 0
        ? <EmptyState icon={Users} title="No crew configured" hint="Add crew for signature autocomplete in entries" />
        : <div className="rounded-xl border bg-white overflow-x-auto">
            <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Rank</TableHead><TableHead>License</TableHead><TableHead>Status</TableHead><TableHead className="w-16">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{crew.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell><TableCell>{c.rank}</TableCell><TableCell>{c.licenseNo || '—'}</TableCell>
                <TableCell><Badge variant={c.enabled ? 'success' : 'outline'}>{c.enabled ? 'Active' : 'Inactive'}</Badge></TableCell>
                <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => { setForm({ id: c.id, vesselId, name: c.name, rank: c.rank, licenseNo: c.licenseNo, enabled: c.enabled !== false }); setOpen(true) }}><PenLine className="w-4 h-4" /></Button><Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(c.id)}><Trash2 className="w-4 h-4" /></Button></div></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </div>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Crew member</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Rank"><Select value={form.rank} onValueChange={(v) => setForm({ ...form, rank: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RANKS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="License no."><Input value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="h-4 w-4" />Active</label>
            <DialogFooter className="gap-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}


