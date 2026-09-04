// pages/Analytics.jsx — quantity trends, disposal breakdown, efficiency.
import { useMemo } from 'react'
import { useApp } from '@/store/AppContext.jsx'
import { currentVessel, entriesFor } from '@/lib/store.js'
import { PageHeader, StatCard, EmptyState } from '@/components/ui/misc.jsx'
import { Button } from '@/components/ui/button.jsx'
import { BarChart3, Download } from 'lucide-react'
import { monthlyQuantities, disposalSummary, disposalEfficiency, sludgeGenerationRatePerDay, countsByOperation } from '@/lib/analytics/engine.js'
import { OP_TITLES } from '@/data/catalog.js'
import { exportCSV } from '@/lib/csvExport.js'

const COLORS = ['#2563eb', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#ca8a04', '#475569']

export function Analytics() {
  const { state } = useApp()
  const vessel = currentVessel(state)
  const entries = entriesFor(state, vessel?.id)
  const store = useMemo(() => ({ ...state, activeVesselId: vessel?.id }), [state, vessel])

  const monthly = useMemo(() => monthlyQuantities(store), [store])
  const summary = useMemo(() => disposalSummary(store), [store])
  const efficiency = useMemo(() => disposalEfficiency(store), [store])
  const rate = useMemo(() => sludgeGenerationRatePerDay(store), [store])
  const counts = useMemo(() => countsByOperation(store), [store])
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.m3))
  const maxCount = Math.max(1, ...Object.values(counts))

  return (
    <div className="space-y-6">
      <PageHeader icon={BarChart3} title="Analytics" subtitle={vessel ? `${vessel.name} — waste & oil movements` : ''}>
        <Button variant="outline" onClick={() => exportCSV(entries, vessel)} disabled={!entries.length}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
      </PageHeader>

      {entries.length === 0 ? (
        <EmptyState icon={BarChart3} title="No data to analyse yet" hint="Record some entries to see trends" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Shore disposal" value={`${summary.receivedShoreM3} m³`} tone="green" icon={Download} />
            <StatCard label="Incinerated" value={`${summary.incineratedM3} m³`} tone="blue" icon={Download} />
            <StatCard label="To sea" value={`${summary.dischargedToSeaM3} m³`} tone="amber" icon={Download} />
            <StatCard label="Disposal efficiency" value={efficiency == null ? '—' : `${efficiency}%`} tone="green" icon={Download} hint={`Sludge ${rate} m³/day`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Quantity by month */}
            <section className="rounded-xl border bg-white p-5">
              <h2 className="text-sm font-semibold mb-4">Quantity by month (m³)</h2>
              {monthly.length === 0 ? <p className="text-sm text-slate-400">No dated quantities.</p> : (
                <div className="flex items-end gap-2 h-48">
                  {monthly.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-500">{m.m3.toFixed(1)}</span>
                      <div className="w-full rounded-t" style={{ height: `${(m.m3 / maxMonthly) * 100}%`, minHeight: 4, background: 'linear-gradient(180deg,#2563eb,#60a5fa)' }} />
                      <span className="text-[10px] text-slate-400">{m.month}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Entries by operation */}
            <section className="rounded-xl border bg-white p-5">
              <h2 className="text-sm font-semibold mb-4">Entries by operation</h2>
              <div className="space-y-2">
                {Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)).map(([code, count]) => (
                  <div key={code} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-bold text-slate-600">{code})</span>
                    <span className="w-40 truncate text-xs text-slate-500">{OP_TITLES[code]}</span>
                    <div className="flex-1 h-4 rounded bg-slate-100 overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${(count / maxCount) * 100}%`, background: COLORS[(code.charCodeAt(0)) % COLORS.length] }} />
                    </div>
                    <span className="w-8 text-xs text-right text-slate-500">{count}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Disposal breakdown */}
            <section className="rounded-xl border bg-white p-5">
              <h2 className="text-sm font-semibold mb-4">Disposal breakdown (m³)</h2>
              <div className="flex h-6 rounded overflow-hidden">
                <div style={{ width: pct(summary.receivedShoreM3, summary), background: '#16a34a' }} />
                <div style={{ width: pct(summary.incineratedM3, summary), background: '#2563eb' }} />
                <div style={{ width: pct(summary.dischargedToSeaM3, summary), background: '#f59e0b' }} />
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-600" />To reception facility — {summary.receivedShoreM3} m³</li>
                <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-600" />Incinerated — {summary.incineratedM3} m³</li>
                <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-500" />Discharged to sea — {summary.dischargedToSeaM3} m³</li>
              </ul>
              <p className="text-xs text-slate-400 mt-3">Sludge generation rate: {rate} m³/day · Total recorded: {summary.totalOilM3} m³</p>
            </section>

            {/* By volume */}
            <section className="rounded-xl border bg-white p-5">
              <h2 className="text-sm font-semibold mb-4">Volume by operation (cumulative m³)</h2>
              <ul className="space-y-2">
                {Object.entries(summary.byOp).sort(([a], [b]) => a.localeCompare(b)).map(([code, m3]) => (
                  <li key={code} className="flex justify-between text-sm border-b border-slate-100 py-1.5">
                    <span className="text-slate-600">{OP_TITLES[code]}</span>
                    <span className="font-medium">{m3} m³</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

function pct(v, s) {
  const scales = [s.receivedShoreM3, s.incineratedM3, s.dischargedToSeaM3]
  const total = scales.reduce((a, b) => a + b, 0)
  if (!total) return '0%'
  return `${((v / total) * 100).toFixed(1)}%`
}
