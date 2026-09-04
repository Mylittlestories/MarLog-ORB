// pages/Templates.jsx
import { useState } from 'react'
import { useApp } from '@/store/AppContext.jsx'
import { templatesFor, currentVessel } from '@/lib/store.js'
import { PageHeader, EmptyState, Field } from '@/components/ui/misc.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog.jsx'
import { ClipboardList, Plus, Trash2, PenLine, Play } from 'lucide-react'
import { OPERATIONS, OPERATION_CODES, RANKS } from '@/data/catalog.js'
import { uid } from '@/domain/model.js'

const blankTpl = { name: '', description: '', operationCode: '', itemNumber: '', recordOfOperation: '', rank: 'Chief Engineer', tankRef: '' }

export function Templates({ onUseTemplate }) {
  const { state, dispatch } = useApp()
  const vessel = currentVessel(state)
  const templates = templatesFor(state, vessel?.id)
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)

  const save = (t) => {
    if (t.id) dispatch({ type: 'UPDATE_TEMPLATE', payload: t })
    else dispatch({ type: 'ADD_TEMPLATE', payload: t })
    setOpen(false); setEditing(null)
  }

  return (
    <div className="space-y-4">
      <PageHeader icon={ClipboardList} title="Entry Templates" subtitle="Reusable records for common engineering operations">
        <Button onClick={() => { setEditing(blankTpl); setOpen(true) }}><Plus className="w-4 h-4 mr-2" /> New template</Button>
      </PageHeader>

      {templates.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No templates yet" hint="Create templates to speed up common entries" action={<Button onClick={() => { setEditing(blankTpl); setOpen(true) }}>Create a template</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border bg-white p-4 flex flex-col">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">{t.operationCode || '—'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                <Badge variant="outline">#{t.itemNumber}</Badge>
                <span>Used {t.useCount || 0}×</span>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Button variant="ghost" size="sm" onClick={() => onUseTemplate(t.id)}><Play className="w-3.5 h-3.5 mr-1.5" /> Use</Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(t); setOpen(true) }}><PenLine className="w-3.5 h-3.5 mr-1.5" /> Edit</Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => { if (confirm('Delete this template?')) dispatch({ type: 'DELETE_TEMPLATE', payload: t.id }) }}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && <TemplateDialog template={editing} onClose={() => setOpen(false)} onSave={save} />}
    </div>
  )
}

function TemplateDialog({ template, onClose, onSave }) {
  const [t, setT] = useState(template)
  const [error, setError] = useState('')
  const set = (k, v) => setT((x) => ({ ...x, [k]: v }))
  const op = OPERATIONS[t.operationCode]
  const submit = (e) => {
    e.preventDefault()
    if (!t.name.trim()) { setError('Name required'); return }
    if (!t.operationCode || !t.itemNumber) { setError('Select operation and item'); return }
    onSave({ ...t, id: t.id || uid('tpl'), name: t.name.trim(), recordOfOperation: t.recordOfOperation || '' })
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{template.id ? 'Edit template' : 'New template'}</DialogTitle>
          <DialogDescription>Fill the record so it can be reused for a common operation.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name *" error={error}><Input value={t.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Routine bilge discharge" /></Field>
          <Field label="Description"><Input value={t.description} onChange={(e) => set('description', e.target.value)} placeholder="Short summary" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Operation *">
              <Select value={t.operationCode} onValueChange={(v) => setT({ ...t, operationCode: v, itemNumber: '' })}>
                <SelectTrigger><SelectValue placeholder="Code" /></SelectTrigger>
                <SelectContent>{OPERATION_CODES.map((c) => <SelectItem key={c} value={c}>{c}) {OPERATIONS[c].title}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Item *">
              <Select value={t.itemNumber} onValueChange={(v) => set('itemNumber', v)} disabled={!t.operationCode}>
                <SelectTrigger><SelectValue placeholder="Item" /></SelectTrigger>
                <SelectContent>{op && Object.entries(op.items).map(([n, text]) => <SelectItem key={n} value={n}>{n}. {text}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Record of operation"><Textarea rows={4} value={t.recordOfOperation} onChange={(e) => set('recordOfOperation', e.target.value)} placeholder="Use [TANKS], [QUANTITY], [READING] as fill-in placeholders" /></Field>
          <Field label="Default rank">
            <Select value={t.rank} onValueChange={(v) => set('rank', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RANKS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
