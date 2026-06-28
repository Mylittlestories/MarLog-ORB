import { LayoutDashboard, ClipboardList, Download, BookOpen, Ship } from 'lucide-react'
import { cn } from '@/lib/utils.js'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'vessel', label: 'Vessel Profile', icon: Ship },
  { id: 'entries', label: 'Oil Record Entries', icon: BookOpen },
  { id: 'templates', label: 'Templates', icon: ClipboardList },
  { id: 'export', label: 'Export / Import', icon: Download },
]

export function Sidebar({ currentPage, onNavigate, vessel }) {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col no-print">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">MarLog ORB</h1>
            <p className="text-xs text-slate-400">MARPOL Compliant</p>
          </div>
        </div>
      </div>
      {vessel?.vessel_name && (
        <div className="px-4 py-3 bg-slate-800 mx-3 mt-4 rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Active Vessel</p>
          <p className="font-semibold text-sm">{vessel.vessel_name}</p>
          {vessel.imo_number && <p className="text-xs text-slate-400">IMO: {vessel.imo_number}</p>}
        </div>
      )}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id || (currentPage === 'entry-form' && item.id === 'entries')
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)} className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
              isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-500 text-center">
          Compliant with MARPOL 73/78<br />Annex I Requirements<br />
          <span className="mt-2 text-slate-600">v2.1.2</span>
        </div>
      </div>
    </aside>
  )
}
