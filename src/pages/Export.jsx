import { useApp } from '@/context/AppContext.jsx'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert.jsx'
import { Download, Upload, Printer, Trash2 } from 'lucide-react'
import { exportToJSON, importFromJSON } from '@/data/initialData.js'
import { generateORBPdf } from '@/lib/pdfExport.js'
import { useState, useRef } from 'react'

export function Export() {
  const { state, dispatch } = useApp()
  const { entries, vessel, templates } = state
  const [importStatus, setImportStatus] = useState(null)
  const [importError, setImportError] = useState(null)
  const fileInputRef = useRef(null)

  const handleExportJSON = () => exportToJSON(state)

  const handleExportPDF = () => {
    if (!vessel?.vessel_name) { alert('Please set up your vessel profile first.'); return }
    if (entries.length === 0) { alert('No entries to export. Please create entries first.'); return }
    generateORBPdf(state)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null); setImportStatus('loading')
    try {
      const data = await importFromJSON(file)
      if (!data.vessel || !data.entries) throw new Error('Invalid file format: missing vessel or entries')
      dispatch({ type: 'IMPORT_DATA', payload: data })
      setImportStatus('success')
      setTimeout(() => setImportStatus(null), 3000)
    } catch (err) { setImportError(err.message); setImportStatus(null) }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClearData = () => {
    if (!confirm('Are you sure you want to clear ALL data? This cannot be undone.')) return
    if (!confirm('This will permanently delete all entries, templates, and vessel data.')) return
    dispatch({ type: 'CLEAR_ALL' })
  }

  const activeEntries = entries.filter(e => e.status === 'active')

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Download className="w-6 h-6" /> Export & Import</h1>
        <p className="text-slate-500 mt-1">Backup, restore, and print your Oil Record Book</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{entries.length}</p><p className="text-xs text-slate-500">Total Entries</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-green-600">{activeEntries.length}</p><p className="text-xs text-slate-500">Active Entries</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{templates.length}</p><p className="text-xs text-slate-500">Templates</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Printer className="w-4 h-4" /> Print / Export ORB</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">Generate a formatted Oil Record Book document for printing or official records.</p>
          {entries.length === 0 ? (
            <Alert><AlertDescription>No entries to export yet.</AlertDescription></Alert>
          ) : (
            <Button onClick={handleExportPDF} disabled={!vessel?.vessel_name}><Printer className="w-4 h-4 mr-2" /> Export as PDF</Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Download className="w-4 h-4" /> Export Data</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">Export all your data as a JSON file for backup or transfer.</p>
          <Button onClick={handleExportJSON} variant="outline"><Download className="w-4 h-4 mr-2" /> Export as JSON</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="w-4 h-4" /> Import Data</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500">Restore data from a previously exported JSON file. This will replace all current data.</p>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" id="import-file" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importStatus === 'loading'}>
            <Upload className="w-4 h-4 mr-2" />{importStatus === 'loading' ? 'Importing...' : 'Select JSON File'}
          </Button>
          {importStatus === 'success' && (
            <Alert className="bg-green-50 border-green-200">
              <AlertTitle className="text-green-900">Import Successful</AlertTitle>
              <AlertDescription className="text-green-700">Data imported successfully. All previous data has been replaced.</AlertDescription>
            </Alert>
          )}
          {importError && <Alert variant="destructive"><AlertTitle>Import Failed</AlertTitle><AlertDescription>{importError}</AlertDescription></Alert>}
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader><CardTitle className="text-base flex items-center gap-2 text-red-700"><Trash2 className="w-4 h-4" /> Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">Permanently delete all data. Consider exporting a backup first.</p>
          <Button variant="destructive" onClick={handleClearData}><Trash2 className="w-4 h-4 mr-2" /> Clear All Data</Button>
        </CardContent>
      </Card>
    </div>
  )
}
