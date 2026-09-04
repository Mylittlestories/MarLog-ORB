// pages/DataPage.jsx — export/import/backup & PDF.
import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/store/AppContext.jsx'
import { PageHeader, StatCard } from '@/components/ui/misc.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert.jsx'
import { Database, Download, Upload, Printer, Trash2, Archive } from 'lucide-react'
import { generateORBPdf } from '@/lib/pdfExport.js'
import { createSnapshot, listSnapshots, clearLocal } from '@/lib/storage/adapter.js'
import { SCHEMA_VERSION } from '@/domain/model.js'

export function DataPage() {
  const { state, dispatch } = useApp()
  const [importStatus, setImportStatus] = useState(null)
  const [importError, setImportError] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [snapMsg, setSnapMsg] = useState(null)
  const fileInputRef = useRef(null)

  const refreshSnap = async () => { try { setSnapshots(await listSnapshots()) } catch { setSnapshots([]) } }
  useEffect(() => { refreshSnap() }, [])

  const handleExportPDF = () => {
    if (!state.vessels.some((v) => v.id === state.activeVesselId)) { alert('Set up a vessel first.'); return }
    if (!state.entries.length) { alert('No entries to export yet.'); return }
    generateORBPdf(state)
  }

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify({ schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), app: 'MarLog ORB', store: state }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `MarLog_ORB_${new Date().toISOString().slice(0, 10)}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null); setImportStatus('loading')
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const store = data.store ? data.store : data
      if (!store.vessels || !store.entries) throw new Error('Invalid file: missing vessels or entries')
      if (!confirm('Importing will REPLACE all current data. Continue?')) { setImportStatus(null); fileInputRef.current.value = ''; return }
      await createSnapshot(state, 'preImport')
      dispatch({ type: 'IMPORT', payload: { ...store, auditEnabled: true } })
      setImportStatus('success')
      setTimeout(() => setImportStatus(null), 3000)
    } catch (err) { setImportError(err.message); setImportStatus(null) }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSnapshot = async () => {
    const r = await createSnapshot(state, 'manual')
    setSnapMsg(r ? 'Snapshot saved.' : `Failed: ${r}`)
    refreshSnap(); setTimeout(() => setSnapMsg(null), 3000)
  }

  const handleClear = () => {
    if (!confirm('This will permanently delete ALL vessels, entries and settings. This cannot be undone.')) return
    if (!confirm('Export a JSON backup first if you need it. Confirm permanent clear?')) return
    clearLocal()
    dispatch({ type: 'CLEAR_ALL' })
  }

  const vesselCount = state.vessels.filter((v) => !v.deletedAt).length

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader icon={Database} title="Export & Backup" subtitle="Portable backups, PDF, CSV and restore" />
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Vessels" value={vesselCount} />
        <StatCard label="Entries" value={state.entries.length} />
        <StatCard label="Snapshots" value={snapshots.length} tone="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Printer className="w-4 h-4 text-slate-400" /> Oil Record Book PDF</h2>
          <p className="text-sm text-slate-500">Formatted ORB for printing or official records.</p>
          <Button onClick={handleExportPDF} disabled={!state.entries.length}><Printer className="w-4 h-4 mr-2" /> Export PDF</Button>
        </section>
        <section className="rounded-xl border bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Download className="w-4 h-4 text-slate-400" /> JSON backup</h2>
          <p className="text-sm text-slate-500">Full portable backup of everything (versioned).</p>
          <Button variant="outline" onClick={handleExportJSON}><Download className="w-4 h-4 mr-2" /> Download backup</Button>
        </section>
        <section className="rounded-xl border bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Upload className="w-4 h-4 text-slate-400" /> Import data</h2>
          <p className="text-sm text-slate-500">Restore from a JSON backup. Replaces current data.</p>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" id="import-file" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importStatus === 'loading'}><Upload className="w-4 h-4 mr-2" />{importStatus === 'loading' ? 'Importing...' : 'Select JSON'}</Button>
          {importStatus === 'success' && <Alert className="bg-green-50 border-green-200"><AlertTitle className="text-green-900">Import successful</AlertTitle><AlertDescription className="text-green-700">All data replaced.</AlertDescription></Alert>}
          {importError && <Alert variant="destructive"><AlertTitle>Import failed</AlertTitle><AlertDescription>{importError}</AlertDescription></Alert>}
        </section>
        <section className="rounded-xl border bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Archive className="w-4 h-4 text-slate-400" /> Snapshots</h2>
          <p className="text-sm text-slate-500">Versioned on-device snapshots (IndexedDB) taken before upgrades & destructive ops.</p>
          <Button variant="outline" onClick={handleSnapshot}><Archive className="w-4 h-4 mr-2" /> Take snapshot</Button>
          {snapMsg && <p className="text-xs text-slate-600">{snapMsg}</p>}
          {snapshots.length === 0 ? <p className="text-sm text-slate-400">No snapshots yet.</p> : (
            <ul className="space-y-1.5 max-h-40 overflow-y-auto">
              {snapshots.slice(0, 8).map((s) => <li key={s.id} className="flex justify-between text-sm bg-slate-50 rounded px-3 py-1.5"><span className="font-medium">{s.kind}</span><span className="text-xs text-slate-500">{new Date(s.at).toLocaleString()}</span></li>)}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-red-200 bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2 text-red-700"><Trash2 className="w-4 h-4" /> Danger zone</h2>
        <p className="text-sm text-slate-500">Permanently delete all data and reset to a fresh install.</p>
        <Button variant="destructive" onClick={handleClear}><Trash2 className="w-4 h-4 mr-2" /> Clear all data</Button>
      </section>
    </div>
  )
}
