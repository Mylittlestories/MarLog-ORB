import { useApp } from '@/context/AppContext.jsx'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { PlusCircle, BookOpen, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils.js'

export function Dashboard({ onNavigate, onNewEntry }) {
  const { state } = useApp()
  const { vessel, entries, templates } = state

  const activeEntries = entries.filter(e => e.status === 'active')
  const recentEntries = entries.slice(0, 5)
  const thisMonth = entries.filter(e => {
    if (!e.date) return false
    const d = new Date(e.date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const isVesselSetup = vessel?.vessel_name && vessel?.imo_number

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            {isVesselSetup ? `Oil Record Book for ${vessel.vessel_name}` : 'Complete vessel profile setup to begin recording entries'}
          </p>
        </div>
        <Button onClick={onNewEntry} disabled={!isVesselSetup}>
          <PlusCircle className="w-4 h-4 mr-2" /> New Entry
        </Button>
      </div>

      {!isVesselSetup && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900">Vessel Profile Incomplete</h3>
            <p className="text-sm text-amber-700 mt-1">Please complete the vessel profile with vessel name and IMO number before recording entries.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => onNavigate('vessel')}>Setup Vessel Profile</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500">Total Entries</p><p className="text-3xl font-bold mt-1">{entries.length}</p></div>
              <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500">Active Entries</p><p className="text-3xl font-bold mt-1 text-green-600">{activeEntries.length}</p></div>
              <CheckCircle2 className="w-8 h-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500">This Month</p><p className="text-3xl font-bold mt-1 text-blue-600">{thisMonth.length}</p></div>
              <Clock className="w-8 h-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-slate-500">Templates</p><p className="text-3xl font-bold mt-1">{templates.length}</p></div>
              <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Entries</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('entries')}>View All →</Button>
            </CardHeader>
            <CardContent>
              {recentEntries.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No entries recorded yet</p>
                  <p className="text-sm mt-1">Click "New Entry" to create your first record</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEntries.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${entry.status === 'corrected' ? 'bg-yellow-100 text-yellow-700' : entry.status === 'void' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {entry.operation_code}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{entry.record_of_operation?.substring(0, 80)}...</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>{formatDate(entry.date)} {formatTime(entry.time_utc)}</span>
                          <span>•</span>
                          <span>Entry #{entry.entry_number}</span>
                        </div>
                      </div>
                      <Badge variant={entry.status === 'corrected' ? 'warning' : entry.status === 'void' ? 'destructive' : 'info'}>{entry.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" onClick={onNewEntry} disabled={!isVesselSetup}><PlusCircle className="w-4 h-4 mr-2" /> New Entry</Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => onNavigate('templates')}><BookOpen className="w-4 h-4 mr-2" /> Browse Templates</Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => onNavigate('export')}><BookOpen className="w-4 h-4 mr-2" /> Export ORB</Button>
            </CardContent>
          </Card>

          {vessel?.vessel_name && (
            <Card>
              <CardHeader><CardTitle className="text-base">Vessel Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium">{vessel.vessel_name}</span></div>
                {vessel.imo_number && <div className="flex justify-between"><span className="text-slate-500">IMO</span><span className="font-medium">{vessel.imo_number}</span></div>}
                {vessel.flag_state && <div className="flex justify-between"><span className="text-slate-500">Flag</span><span className="font-medium">{vessel.flag_state}</span></div>}
                {vessel.vessel_type && <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-medium capitalize">{vessel.vessel_type.replace('_', ' ')}</span></div>}
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => onNavigate('vessel')}>Edit Profile →</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
