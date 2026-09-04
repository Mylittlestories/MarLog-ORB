// pages/Entries.jsx — searchable, filterable ORB with correction workflow.
import { useMemo, useState } from 'react'
import { useApp } from '@/store/AppContext.jsx'
import { currentVessel, entriesFor, STATUS } from '@/lib/store.js'
import { PageHeader, EmptyState } from '@/components/ui/misc.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { BookOpen, PlusCircle, Search, Eye, Copy, XCircle } from 'lucide-react'
import { formatDate, formatPosition } from '@/lib/utils.js'
import { opLabel, OP_TITLES } from '@/data/catalog.js'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { EntryViewDialog } from '@/components/features/entries/EntryViewDialog.jsx'
import { CorrectionDialog } from '@/components/features/entries/CorrectionDialog.jsx'

const statusVariant = { active: 'success', corrected: 'warning', void: 'destructive' }

export function Entries({ onNewEntry, onEditEntry }) {
  const { state, dispatch } = useApp()
  const vessel = currentVessel(state)
  const entries = entriesFor(state, vessel?.id)

  const [q, setQ] = useState('')
  const [code, setCode] = useState('all')
  const [status, setStatus] = useState('all')
  const [viewing, setViewing] = useState(null)
  const [correcting, setCorrecting] = useState(null)

  const filtered = useMemo(() => entries.filter((e) => {
    const s = q.toLowerCase()
    const mq = !q || (e.recordOfOperation || '').toLowerCase().includes(s) || String(e.entryNumber).includes(s) || (e.signedBy || '').toLowerCase().includes(s)
    const mc = code === 'all' || e.operationCode === code
    const ms = status === 'all' || e.status === status
    return mq && mc && ms
  }), [entries, q, code, status])

  return (
    <div className="space-y-4">
      <PageHeader icon={BookOpen} title="Oil Record Book" subtitle={vessel ? `${vessel.name} — ${entries.length} entries` : ''}>
        <Button onClick={onNewEntry} disabled={!vessel}><PlusCircle className="w-4 h-4 mr-2" /> New Entry</Button>
      </PageHeader>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by description, number or signer..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={code} onValueChange={setCode}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Operation" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All operations</SelectItem>
            {Object.entries(OP_TITLES).map(([c, t]) => <SelectItem key={c} value={c}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="corrected">Corrected</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-white">
        {filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title="No entries found" hint={entries.length ? 'Try adjusting your search or filters' : 'Start recording your oil record book'}
            action={entries.length === 0 ? <Button onClick={onNewEntry} disabled={!vessel}><PlusCircle className="w-4 h-4 mr-2" /> Create first entry</Button> : null} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>
                  <TableHead className="w-14">Ops</TableHead>
                  <TableHead>Operation / description</TableHead>
                  <TableHead className="whitespace-nowrap">Date & time</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Qty (m³)</TableHead>
                  <TableHead>Signed by</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id} className={e.status === STATUS.VOID ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{e.entryNumber}</TableCell>
                    <TableCell><div className="w-8 h-8 rounded flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-700">{e.operationCode || '—'}</div></TableCell>
                    <TableCell>
                      <p className="text-xs text-slate-400 mb-0.5">{opLabel(e.operationCode, e.itemNumber)}</p>
                      <p className="text-sm line-clamp-2">{e.recordOfOperation}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap"><div>{formatDate(e.date)}</div><div className="text-slate-500 text-xs">{e.timeUtc}</div></TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{e.position?.lat && e.position?.lon ? formatPosition(e.position.lat, e.position.lon) : '—'}</TableCell>
                    <TableCell className="text-sm">{e.quantityM3 ?? '—'}</TableCell>
                    <TableCell><div className="text-sm font-medium">{e.signedBy || '—'}</div><div className="text-xs text-slate-500">{e.rank}</div></TableCell>
                    <TableCell><Badge variant={statusVariant[e.status] || 'info'}>{e.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" title="View" onClick={() => setViewing(e)}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" title="Edit" disabled={e.status !== STATUS.ACTIVE} onClick={() => onEditEntry(e)}><Copy className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" title="Correct" disabled={e.status !== STATUS.ACTIVE} onClick={() => setCorrecting(e)}><XCircle className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {filtered.length > 0 && <p className="text-sm text-slate-500 px-5 py-3 border-t text-center">Showing {filtered.length} of {entries.length} entries</p>}
      </div>

      {viewing && <EntryViewDialog entry={viewing} onClose={() => setViewing(null)} vessel={vessel} />}
      {correcting && <CorrectionDialog entry={correcting} onClose={() => setCorrecting(null)} />}
    </div>
  )
}
