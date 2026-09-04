// pages/AuditLog.jsx — activity log browser.
import { useState } from "react"
import { useApp } from '@/store/AppContext.jsx'
import { PageHeader, EmptyState } from '@/components/ui/misc.jsx'
import { History } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { formatDate } from '@/lib/utils.js'

const actionLabel = (a) => a.replace('_', ' ')

export function AuditLog() {
  const { state } = useApp()
  const [entity, setEntity] = useState('all')
  const actions = (state.audit || []).filter((a) => entity === 'all' || a.entity === entity)
  const entities = [...new Set((state.audit || []).map((a) => a.entity))]

  return (
    <div className="space-y-4">
      <PageHeader icon={History} title="Audit Log" subtitle={`${state.audit?.length || 0} recorded actions (latest 500)`} />
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Entity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entities.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-slate-400">Every create/edit/correct/delete is recorded against the device & time.</span>
      </div>
      {actions.length === 0 ? (
        <EmptyState icon={History} title="No activity yet" hint="Actions will appear here as you use the app" />
      ) : (
        <ul className="rounded-xl border bg-white divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
          {actions.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-5 py-3">
              <span className="w-2 h-2 rounded-full mt-2 bg-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm"><span className="font-medium">{a.actor}</span> <span className="text-slate-500">{actionLabel(a.action)}</span> <span className="font-medium">{a.entity}</span></p>
                <p className="text-xs text-slate-400">{formatDate(a.at?.slice(0, 10))} {a.at?.slice(11, 16)} · {a.entityId}</p>
                {a.detail && <p className="text-xs text-slate-500 mt-0.5 font-mono truncate">{a.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
