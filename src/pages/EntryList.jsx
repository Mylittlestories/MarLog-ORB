import { useApp } from '@/context/AppContext.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert.jsx'
import { PlusCircle, Search, BookOpen, AlertCircle, Edit2, XCircle, Eye } from 'lucide-react'
import { formatDate, formatPosition } from '@/lib/utils.js'
import { MARPOL_OPERATIONS, OPERATION_CODES } from '@/data/marpolOperations.js'
import { useState, useMemo } from 'react'
import { EntryViewDialog } from '@/components/features/entries/EntryViewDialog.jsx'
import { CorrectionDialog } from '@/components/features/entries/CorrectionDialog.jsx'

export function EntryList({ onEditEntry, onNewEntry }) {
  const { state, dispatch } = useApp()
  const { entries, vessel } = state

  const [searchTerm, setSearchTerm] = useState('')
  const [filterCode, setFilterCode] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewingEntry, setViewingEntry] = useState(null)
  const [correctingEntry, setCorrectingEntry] = useState(null)

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = !searchTerm ||
        entry.record_of_operation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.entry_number?.toString().includes(searchTerm) ||
        entry.signed_by?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCode = filterCode === 'all' || entry.operation_code === filterCode
      const matchesStatus = filterStatus === 'all' || entry.status === filterStatus
      return matchesSearch && matchesCode && matchesStatus
    })
  }, [entries, searchTerm, filterCode, filterStatus])

  const getOperationLabel = (code, item) => {
    if (!code) return '—'
    const op = MARPOL_OPERATIONS[code]
    if (!op) return `${code}.${item}`
    return `${code}) ${op.items[item] || item}`
  }

  const handleCorrectEntry = ({ entryId, correctionNote, correctedBy, correctionDate }) => {
    dispatch({ type: 'CORRECT_ENTRY', payload: { entryId, correctionNote, correctedBy, correctionDate } })
    setCorrectingEntry(null)
  }

  if (!vessel?.vessel_name) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Vessel Profile Required</AlertTitle>
          <AlertDescription>Please set up your vessel profile before recording entries.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><BookOpen className="w-6 h-6" /> Oil Record Book</h1>
          <p className="text-slate-500 mt-1">{vessel.vessel_type === 'oil_tanker' ? 'Part I' : 'Part II'} — {entries.length} entries recorded</p>
        </div>
        <Button onClick={onNewEntry}><PlusCircle className="w-4 h-4 mr-2" /> New Entry</Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search entries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
            </div>
            <Select value={filterCode} onValueChange={setFilterCode}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Operation Code" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operations</SelectItem>
                {OPERATION_CODES.map(code => (
                  <SelectItem key={code} value={code}>{code}) {MARPOL_OPERATIONS[code].name.split('(')[0].trim()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="corrected">Corrected</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No entries found</p>
              <p className="text-sm mt-1">{entries.length === 0 ? 'Start recording your oil record book entries' : 'Try adjusting your search or filters'}</p>
              {entries.length === 0 && <Button className="mt-4" onClick={onNewEntry}><PlusCircle className="w-4 h-4 mr-2" /> Create First Entry</Button>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead className="w-20">Code</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Signed By</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id} className={entry.status === 'void' ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{entry.entry_number}</TableCell>
                    <TableCell>
                      <div className="bg-slate-100 rounded w-10 h-10 flex items-center justify-center font-bold text-sm">{entry.operation_code}</div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-slate-500 mb-1">{getOperationLabel(entry.operation_code, entry.item_number)}</p>
                      <p className="text-sm line-clamp-2">{entry.record_of_operation}</p>
                    </TableCell>
                    <TableCell className="text-sm"><div>{formatDate(entry.date)}</div><div className="text-slate-500">{entry.time_utc}</div></TableCell>
                    <TableCell className="text-sm">{entry.position_lat && entry.position_lon ? formatPosition(entry.position_lat, entry.position_lon) : '—'}</TableCell>
                    <TableCell><div className="text-sm font-medium">{entry.signed_by || '—'}</div><div className="text-xs text-slate-500">{entry.rank}</div></TableCell>
                    <TableCell><Badge variant={entry.status === 'corrected' ? 'warning' : entry.status === 'void' ? 'destructive' : 'success'}>{entry.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingEntry(entry)} title="View"><Eye className="w-4 h-4" /></Button>
                        {entry.status === 'active' && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => onEditEntry(entry)} title="Edit"><Edit2 className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setCorrectingEntry(entry)} title="Correct"><XCircle className="w-4 h-4" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {filteredEntries.length > 0 && <p className="text-sm text-slate-500 mt-3 text-center">Showing {filteredEntries.length} of {entries.length} entries</p>}

      {viewingEntry && <EntryViewDialog entry={viewingEntry} onClose={() => setViewingEntry(null)} vessel={vessel} />}
      {correctingEntry && <CorrectionDialog entry={correctingEntry} onClose={() => setCorrectingEntry(null)} onCorrect={handleCorrectEntry} />}
    </div>
  )
}
