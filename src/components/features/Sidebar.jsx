// components/features/Sidebar.jsx — grouped, clean navigation + global vessel switcher.
import { LayoutDashboard, BookOpen, ClipboardList, Ship, ShieldCheck, BarChart3, History, Database, Plus, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils.js'
import { useApp } from '@/store/AppContext.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { useState } from 'react'
import { AddVesselDialog } from '@/components/features/AddVesselDialog.jsx'

const GROUPS = [
  { label: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Record Book', items: [
    { id: 'entries', label: 'ORB Entries', icon: BookOpen },
    { id: 'templates', label: 'Templates', icon: ClipboardList },
  ]},
  { label: 'Fleet', items: [{ id: 'fleet', label: 'Fleet Setup', icon: Ship }] },
  { label: 'Compliance', items: [{ id: 'rules', label: 'Rules Reference', icon: ShieldCheck }] },
  { label: 'Insights', items: [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Log', icon: History },
  ]},
  { label: 'Data', items: [{ id: 'export', label: 'Export & Backup', icon: Database }] },
]

export function Sidebar({ currentPage, onNavigate, onNewEntry }) {
  const { state, dispatch } = useApp()
  const [addOpen, setAddOpen] = useState(false)
  const [vesselsOpen, setVesselsOpen] = useState(false)
  const vessels = state.vessels.filter((v) => !v.deletedAt)

  return (
    <>
      <aside className="fixed inset-y-0 left-0 w-64 z-30 bg-slate-900 text-white flex flex-col">
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center">
              <Ship className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold leading-tight">MarLog ORB</h1>
              <p className="text-[11px] text-slate-400">MARPOL Record Book</p>
            </div>
          </div>
        </div>

        {/* Vessel switcher */}
        <div className="px-3 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1 mb-1">Vessel</p>
          <Select value={state.activeVesselId} onValueChange={(v) => dispatch({ type: 'SET_ACTIVE_VESSEL', payload: { uid: v } })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {vessels.map((v) => <SelectItem key={v.id} value={v.id}>{v.name || '(unnamed)'}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setAddOpen(true)} className="flex-1 flex items-center justify-center gap-1 rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-1.5 text-xs text-slate-200">
              <Plus className="w-3.5 h-3.5" /> Add vessel
            </button>
            {vessels.length > 1 && (
              <button onClick={() => setVesselsOpen((o) => !o)} className="rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-1.5 text-xs text-slate-200">
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', vesselsOpen && 'rotate-180')} />
              </button>
            )}
          </div>
          {vesselsOpen && (
            <ul className="mt-2 bg-slate-800 rounded-lg p-1 space-y-0.5">
              {vessels.map((v) => (
                <li key={v.id}>
                  <button onClick={() => { dispatch({ type: 'SET_ACTIVE_VESSEL', payload: { uid: v.id } }); setVesselsOpen(false) }}
                    className={cn('w-full text-left px-2.5 py-1.5 rounded-md text-xs', v.id === state.activeVesselId ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700')}>
                    {v.name || '(unnamed)'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 mb-1">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon
                const active = currentPage === item.id || (currentPage === 'entry-form' && item.id === 'entries')
                return (
                  <button key={item.id} onClick={() => onNavigate(item.id)}
                    className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left mb-0.5',
                      active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white')}>
                    <Icon className="w-4 h-4 flex-shrink-0" /> {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          {state.vessels.length > 0 && (
            <button onClick={onNewEntry} className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm font-semibold">
              <Plus className="w-4 h-4" /> New Record Entry
            </button>
          )}
          <p className="text-[10px] text-slate-600 text-center mt-3">v3.0 · MARPOL 73/78 Annex I<br />Offline-first · Open data</p>
        </div>
      </aside>
      <AddVesselDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  )
}
