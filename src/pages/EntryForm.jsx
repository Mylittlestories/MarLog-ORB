// pages/EntryForm.jsx — create/edit an ORB entry, with live compliance checks.
import { useEffect, useState, useMemo } from 'react'
import { useApp } from '@/store/AppContext.jsx'
import { currentVessel, tanksFor, equipmentFor, crewFor, templatesFor } from '@/lib/store.js'
import { PageHeader, Field } from '@/components/ui/misc.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { CompliancePanel } from '@/components/features/CompliancePanel.jsx'
import { ArrowLeft, Save, FileText, MapPin, User, ToggleLeft, CalendarClock } from 'lucide-react'
import { OPERATIONS, OPERATION_CODES, RANKS, TANK_KIND_LABELS, ANNEX_LABELS, ANNEXES } from '@/data/catalog.js'
import { getUTCDateInputValue, getUTCTimeInputValue, isNonNegativeNumber } from '@/lib/utils.js'
import { STATUS } from '@/lib/store.js'

const overboardItems = { C: ['3'], D: ['3'], G: ['4'] }

function blank() {
  return {
    date: getUTCDateInputValue(), timeUtc: getUTCTimeInputValue(), annex: 'I',
    operationCode: '', itemNumber: '', recordOfOperation: '', tankIds: [],
    quantityM3: '', position_lat: '', position_lon: '', shipSpeedKnots: '',
    ppmReading: '', dischargeOverboard: false, signedBy: '', rank: 'Chief Engineer',
  }
}
function fromEntry(e) {
  return {
    date: e.date || '', timeUtc: e.timeUtc || '', annex: e.annex || 'I',
    operationCode: e.operationCode || '', itemNumber: e.itemNumber || '',
    recordOfOperation: e.recordOfOperation || '', tankIds: e.tankIds || [],
    quantityM3: e.quantityM3 ?? '', position_lat: e.position?.lat || '', position_lon: e.position?.lon || '',
    shipSpeedKnots: e.speedKnots ?? '', ppmReading: e.ppmReading ?? '',
    dischargeOverboard: e.dischargeOverboard || false, signedBy: e.signedBy || '', rank: e.rank || 'Chief Engineer',
  }
}

export function EntryForm({ entry, templateSeed, onClose }) {
  const { state, dispatch } = useApp()
  const vessel = currentVessel(state)
  const isEditing = !!entry
  const tanks = tanksFor(state, vessel?.id)
  const equipment = equipmentFor(state, vessel?.id)
  const crew = crewFor(state, vessel?.id)
  const templates = templatesFor(state, vessel?.id)

  const [form, setForm] = useState(() => (entry ? fromEntry(entry) : blank()))
  const [errors, setErrors] = useState({})
  const [override, setOverride] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    if (templateSeed && !entry) {
      const t = templates.find((x) => x.id === templateSeed)
      if (t) applyTemplate(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateSeed])

  const set = (field, value) => { setForm((f) => ({ ...f, [field]: value })); setErrors((e) => ({ ...e, [field]: null })) }

  function applyTemplate(t) {
    const seeded = { ...form, operationCode: t.operationCode, itemNumber: t.itemNumber, recordOfOperation: t.recordOfOperation || form.recordOfOperation, rank: t.rank || form.rank }
    if (t.tankRef) {
      const match = tanks.find((x) => x.name === t.tankRef) || tanks.find((x) => x.kind === 'bilge')
      if (match) seeded.tankIds = [match.id]
    }
    setForm(seeded)
    dispatch({ type: 'INCREMENT_TEMPLATE_USAGE', payload: t.id })
  }

  const engineEntry = useMemo(() => ({
    operationCode: form.operationCode, itemNumber: form.itemNumber,
    quantityM3: form.quantityM3 ? Number(form.quantityM3) : null,
    speedKnots: form.shipSpeedKnots ? Number(form.shipSpeedKnots) : null,
    position: { lat: form.position_lat, lon: form.position_lon },
    tankIds: form.tankIds, tankId: form.tankIds[0] || '',
    status: entry?.status || STATUS.ACTIVE,
    dischargeOverboard: form.dischargeOverboard || ((overboardItems[form.operationCode] || []).includes(form.itemNumber)),
    ppmReading: form.ppmReading ? Number(form.ppmReading) : null,
  }), [form, entry])

  const validate = () => {
    const e = {}
    if (!form.date) e.date = 'Required'
    if (!form.timeUtc) e.timeUtc = 'Required'
    if (!form.operationCode) e.operationCode = 'Required'
    if (!form.itemNumber) e.itemNumber = 'Required'
    if (!form.recordOfOperation.trim()) e.recordOfOperation = 'Required'
    if (!isNonNegativeNumber(form.quantityM3)) e.quantityM3 = 'Must be ≥ 0'
    if (!isNonNegativeNumber(form.shipSpeedKnots)) e.shipSpeedKnots = 'Must be ≥ 0'
    if (!isNonNegativeNumber(form.ppmReading)) e.ppmReading = 'Must be ≥ 0'
    if (!form.signedBy.trim()) e.signedBy = 'Required'
    if (!form.rank) e.rank = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    if (blocked && !override) return
    const payload = {
      date: form.date, timeUtc: form.timeUtc, annex: form.annex,
      operationCode: form.operationCode, itemNumber: form.itemNumber,
      recordOfOperation: form.recordOfOperation, tankIds: form.tankIds, tankId: form.tankIds[0] || '',
      quantityM3: form.quantityM3 ? Number(form.quantityM3) : null,
      position: { lat: form.position_lat, lon: form.position_lon },
      speedKnots: form.shipSpeedKnots ? Number(form.shipSpeedKnots) : null,
      ppmReading: form.ppmReading ? Number(form.ppmReading) : null,
      dischargeOverboard: engineEntry.dischargeOverboard,
      signedBy: form.signedBy, rank: form.rank,
      complianceOverride: (blocked && override) ? { reason: overrideReason.trim(), at: new Date().toISOString() } : null,
    }
    if (isEditing) dispatch({ type: 'UPDATE_ENTRY', payload: { id: entry.id, ...payload, status: entry.status } })
    else dispatch({ type: 'ADD_ENTRY', payload })
    onClose()
  }

  const operation = OPERATIONS[form.operationCode]

  return (
    <div className="space-y-4">
      <PageHeader icon={FileText} title={isEditing ? `Edit Entry #${entry.entryNumber}` : 'New Oil Record Entry'} subtitle={vessel?.name ? `${vessel.name} — ${vessel.vesselType === 'oilTanker' ? 'Part I ORB' : 'Part II ORB'}` : ''}>
        <Button variant="ghost" onClick={onClose}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      </PageHeader>

      {!isEditing && templates.length > 0 && (
        <section className="rounded-xl border bg-white p-3">
          <p className="text-xs font-medium text-slate-500 mb-2">Start from a template</p>
          <div className="flex flex-wrap gap-2">
            {templates.slice(0, 8).map((t) => (
              <button key={t.id} type="button" onClick={() => applyTemplate(t)} title={t.description}
                className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-blue-50 hover:border-blue-300">
                <span className="mr-1.5 text-blue-600 font-bold">{t.operationCode}</span>{t.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <form onSubmit={submit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 space-y-5">
            <section className="rounded-xl border bg-white p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2"><CalendarClock className="w-4 h-4 text-slate-400" /> Date & time (UTC)</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date" htmlFor="date" required error={errors.date}><Input id="date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
                <Field label="Time (UTC)" htmlFor="time" required error={errors.timeUtc}><Input id="time" type="time" value={form.timeUtc} onChange={(e) => set('timeUtc', e.target.value)} /></Field>
              </div>
            </section>

            <section className="rounded-xl border bg-white p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2"><ToggleLeft className="w-4 h-4 text-slate-400" /> Operation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Annex" required>
                  <Select value={form.annex} onValueChange={(v) => set('annex', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ANNEXES.map((a) => <SelectItem key={a} value={a}>{ANNEX_LABELS[a]}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Operation code" required error={errors.operationCode}>
                  <Select value={form.operationCode} onValueChange={(v) => { setForm((f) => ({ ...f, operationCode: v, itemNumber: '' })); setErrors((x) => ({ ...x, operationCode: null, itemNumber: null })) }}>
                    <SelectTrigger className={errors.operationCode ? 'border-red-500' : ''}><SelectValue placeholder="Select operation..." /></SelectTrigger>
                    <SelectContent>{OPERATION_CODES.map((c) => <SelectItem key={c} value={c}>{c}) {OPERATIONS[c].title}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Item number" required error={errors.itemNumber}>
                  <Select value={form.itemNumber} onValueChange={(v) => set('itemNumber', v)} disabled={!form.operationCode}>
                    <SelectTrigger className={errors.itemNumber ? 'border-red-500' : ''}><SelectValue placeholder="Select item..." /></SelectTrigger>
                    <SelectContent>{operation && Object.entries(operation.items).map(([n, t]) => <SelectItem key={n} value={n}>{n}. {t}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Tank / space">
                  <Select value={form.tankIds[0] || 'none'} onValueChange={(v) => set('tankIds', v === 'none' ? [] : [v])}>
                    <SelectTrigger><SelectValue placeholder="Select tank (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {tanks.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} <span className="text-slate-400">({TANK_KIND_LABELS[t.kind]})</span></SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Record of operation *" error={errors.recordOfOperation}>
                <Textarea rows={5} value={form.recordOfOperation} onChange={(e) => set('recordOfOperation', e.target.value)} placeholder="Describe the operation in detail per MARPOL requirements. Include tank IDs, quantities, times and positions." className={errors.recordOfOperation ? 'border-red-500' : ''} />
              </Field>
            </section>

            <section className="rounded-xl border bg-white p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> Measurements, position & discharge</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Quantity (m³)" error={errors.quantityM3}><Input type="number" min="0" step="0.001" value={form.quantityM3} onChange={(e) => set('quantityM3', e.target.value)} /></Field>
                <Field label="OCM reading (ppm)" error={errors.ppmReading}><Input type="number" min="0" step="0.1" value={form.ppmReading} onChange={(e) => set('ppmReading', e.target.value)} /></Field>
                <Field label="Latitude"><Input value={form.position_lat} onChange={(e) => set('position_lat', e.target.value)} placeholder="35°27.5'N" /></Field>
                <Field label="Longitude"><Input value={form.position_lon} onChange={(e) => set('position_lon', e.target.value)} placeholder="140°58.6'E" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ship speed (knots)" error={errors.shipSpeedKnots}><Input type="number" min="0" step="0.1" value={form.shipSpeedKnots} onChange={(e) => set('shipSpeedKnots', e.target.value)} /></Field>
                <div className="flex items-end pb-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.dischargeOverboard} onChange={(e) => set('dischargeOverboard', e.target.checked)} className="h-4 w-4" />Discharge overboard</label>
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-white p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> Certification</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Signed by *" required error={errors.signedBy}>
                  <Input value={form.signedBy} onChange={(e) => set('signedBy', e.target.value)} list="crew-list" placeholder="Officer name" />
                  <datalist id="crew-list">{crew.map((c) => <option key={c.id} value={c.name} />)}</datalist>
                </Field>
                <Field label="Rank *" required error={errors.rank}>
                  <Select value={form.rank} onValueChange={(v) => set('rank', v)}>
                    <SelectTrigger className={errors.rank ? 'border-red-500' : ''}><SelectValue /></SelectTrigger>
                    <SelectContent>{RANKS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
            </section>
          </div>

          <div className="space-y-5 lg:sticky lg:top-0">
            <CompliancePanel formData={engineEntry} tanks={tanks} equipment={equipment} onBlockedChange={setBlocked} />
            {blocked && !override && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-red-800">Blocked operation</p>
                <p className="text-xs text-red-700">The compliance engine reports this entry is not permitted. To proceed, set an override and provide a reason (logged to the audit trail).</p>
                <button type="button" onClick={() => { setOverride(true); setOverrideReason('') }} className="text-xs font-semibold text-blue-700 underline">Set override</button>
              </div>
            )}
            {override && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-amber-800">Override active</p>
                <Textarea rows={2} value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Reason for overriding compliance warnings..." className={!overrideReason.trim() ? 'border-red-400' : ''} />
                <button type="button" onClick={() => setOverride(false)} className="text-xs font-semibold text-slate-500 underline">Cancel override</button>
              </div>
            )}
            <div className="rounded-xl border bg-white p-4">
              <Button type="submit" className="w-full" disabled={blocked && !override}><Save className="w-4 h-4 mr-2" />{isEditing ? 'Update entry' : 'Save entry'}</Button>
              <Button type="button" variant="outline" className="w-full mt-2" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
