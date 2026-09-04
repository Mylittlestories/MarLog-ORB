// pages/Rules.jsx — reference to the compliance rule set + special areas.
import { PageHeader } from '@/components/ui/misc.jsx'
import { ShieldCheck, Map } from 'lucide-react'
import { RULES, severityLabel } from '@/lib/compliance/regulations.js'
import { SPECIAL_AREAS } from '@/lib/compliance/specialAreas.js'

const tone = { blocked: 'bg-red-100 text-red-700', warning: 'bg-amber-100 text-amber-700', info: 'bg-blue-100 text-blue-700' }

export function Rules() {
  return (
    <div className="space-y-6">
      <PageHeader icon={ShieldCheck} title="Compliance Rules" subtitle="MARPOL rules the engine checks before you save an entry" />
      <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-500">
        These rules are advisory guidance. Blocked rules can be overridden with a reason, which is logged to the audit trail. Final responsibility remains with the vessel/operator.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RULES.map((r) => (
          <div key={r.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{r.id}</span>
              <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${tone[r.severity] || tone.info}`}>{severityLabel(r.severity)}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{r.reference}</p>
          </div>
        ))}
      </div>
      <PageHeader icon={Map} title="Special Areas" subtitle="MARPOL Annex I special-area approximations" />
      <div className="rounded-xl border bg-white p-4">
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
          {SPECIAL_AREAS.map((a) => <li key={a.name} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" />{a.name}{a.note ? <span className="text-xs text-slate-400">· {a.note}</span> : null}</li>)}
        </ul>
        <p className="text-xs text-slate-400 mt-4">Coordinates are simplified polygons. The production build should use an exact offline coastline dataset for precise 12 nm distance checks.</p>
      </div>
      <div className="rounded-xl border bg-white p-4 text-xs text-slate-500 space-y-1">
        <p><b>Severity meanings:</b> <b>Blocked</b> = save prevented unless overridden. <b>Warning</b> = allowed but flagged for confirmation. <b>Info</b> = neutral guidance.</p>
        <p><b>Distance-to-land</b> is estimated against a sampled coastline; treat as approximate.</p>
      </div>
    </div>
  )
}
