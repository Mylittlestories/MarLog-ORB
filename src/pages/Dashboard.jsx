// pages/Dashboard.jsx
import { useApp } from '@/store/AppContext.jsx'
import { currentVessel, entriesFor, vesselSummary } from '@/lib/store.js'
import { PageHeader, StatCard, EmptyState } from '@/components/ui/misc.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { LayoutDashboard, BookOpen, CheckCircle2, AlertTriangle, Clock, PlusCircle, ShieldCheck, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils.js'
import { opLabel } from '@/data/catalog.js'

const statusVariant = { active: 'success', corrected: 'warning', void: 'destructive' }

export function Dashboard({ onNavigate, onNewEntry }) {
  const { state } = useApp()
  const summary = vesselSummary(state)
  if (!summary) return <EmptyState icon={BookOpen} title="No vessels yet" hint="Add a vessel to begin" action={<Button onClick={() => onNavigate('fleet')}>Set up fleet</Button>} />

  const vessel = currentVessel(state)
  const recent = entriesFor(state, vessel.id).slice(0, 6)
  const isSetup = vessel.name && vessel.imo

  return (
    <div className="space-y-6">
      <PageHeader icon={LayoutDashboard} title="Dashboard" subtitle={vessel.name ? `Oil Record Book — ${vessel.name}${vessel.imo ? ` · IMO ${vessel.imo}` : ''}` : 'Complete vessel setup to begin'}>
        <Button onClick={onNewEntry} disabled={!isSetup}><PlusCircle className="w-4 h-4 mr-2" /> New Entry</Button>
      </PageHeader>

      {!isSetup && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">Vessel profile incomplete</h3>
            <p className="text-sm text-amber-700 mt-1">Add the vessel name and IMO number before recording entries. You can also add equipment, tanks and crew under <b>Fleet Setup</b>.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onNavigate('fleet')}>Set up now</Button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total entries" value={summary.total} icon={BookOpen} />
        <StatCard label="Active" value={summary.active} tone="green" icon={CheckCircle2} />
        <StatCard label="This month" value={summary.thisMonth} tone="blue" icon={Clock} />
        <StatCard label="Void / corrected" value={summary.voided + summary.corrected} tone="amber" icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 rounded-xl border bg-white">
          <header className="flex items-center justify-between px-5 py-3 border-b">
            <h2 className="text-sm font-semibold text-slate-800">Recent entries</h2>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('entries')}>View all <ArrowRight className="w-3.5 h-3.5" /></Button>
          </header>
          {recent.length === 0 ? (
            <EmptyState icon={BookOpen} title="No entries yet" hint="Click “New Entry” to create your first record" action={<Button onClick={onNewEntry} disabled={!isSetup}><PlusCircle className="w-4 h-4 mr-2" /> New Entry</Button>} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${e.status === 'corrected' ? 'bg-yellow-100 text-yellow-700' : e.status === 'void' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{e.operationCode}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{e.recordOfOperation || opLabel(e.operationCode, e.itemNumber)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(e.date)} {e.timeUtc} · Entry #{e.entryNumber}</p>
                  </div>
                  <Badge variant={statusVariant[e.status] || 'info'}>{e.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Quick actions</h2>
            <div className="space-y-2">
              <Button className="w-full justify-start" variant="outline" onClick={onNewEntry} disabled={!isSetup}><PlusCircle className="w-4 h-4 mr-2" /> New entry</Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => onNavigate('rules')}><ShieldCheck className="w-4 h-4 mr-2" /> Compliance rules</Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => onNavigate('export')}><BookOpen className="w-4 h-4 mr-2" /> Export & backup</Button>
            </div>
          </section>
          <section className="rounded-xl border bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Vessel</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="font-medium">{vessel.name || '—'}</dd></div>
              {vessel.imo && <div className="flex justify-between"><dt className="text-slate-500">IMO</dt><dd className="font-medium">{vessel.imo}</dd></div>}
              {vessel.flagState && <div className="flex justify-between"><dt className="text-slate-500">Flag</dt><dd className="font-medium">{vessel.flagState}</dd></div>}
              <button className="mt-1 text-sm text-blue-600 hover:underline" onClick={() => onNavigate('fleet')}>Edit profile →</button>
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}
