import { useState, useEffect } from 'react'
import { AppProvider, useApp } from '@/store/AppContext.jsx'
import { Sidebar } from '@/components/features/Sidebar.jsx'
import { Dashboard } from '@/pages/Dashboard.jsx'
import { Entries } from '@/pages/Entries.jsx'
import { EntryForm } from '@/pages/EntryForm.jsx'
import { Templates } from '@/pages/Templates.jsx'
import { Fleet } from '@/pages/Fleet.jsx'
import { Analytics } from '@/pages/Analytics.jsx'
import { AuditLog } from '@/pages/AuditLog.jsx'
import { Rules } from '@/pages/Rules.jsx'
import { DataPage } from '@/pages/DataPage.jsx'
import { AppLoading } from '@/components/features/AppLoading.jsx'

function AppContent() {
  const { state, ready, migrationNote, setMigrationNote } = useApp()
  const [page, setPage] = useState('dashboard')
  const [editingEntry, setEditingEntry] = useState(null)
  const [newFromTemplate, setNewFromTemplate] = useState(null)

  useEffect(() => {
    if (!migrationNote) return
    const id = setTimeout(() => setMigrationNote(null), 6000)
    return () => clearTimeout(id)
  }, [migrationNote])

  if (!ready) return <AppLoading />

  const openNewEntry = (templateId = null) => { setEditingEntry(null); setNewFromTemplate(templateId); setPage('entry-form') }
  const openEditEntry = (entry) => { setEditingEntry(entry); setNewFromTemplate(null); setPage('entry-form') }
  const closeForm = () => { setEditingEntry(null); setNewFromTemplate(null); setPage('entries') }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar currentPage={page} onNavigate={setPage} onNewEntry={openNewEntry} />
      <main className="lg:pl-64">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {migrationNote && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <span className="font-semibold">✓</span> {migrationNote}
            </div>
          )}
          {renderPage()}
        </div>
      </main>
    </div>
  )

  function renderPage() {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={setPage} onNewEntry={openNewEntry} />
      case 'entries': return <Entries onNewEntry={openNewEntry} onEditEntry={openEditEntry} />
      case 'entry-form': return <EntryForm entry={editingEntry} templateSeed={newFromTemplate} onClose={closeForm} onNavigate={setPage} />
      case 'templates': return <Templates onUseTemplate={openNewEntry} onNavigate={setPage} />
      case 'fleet': return <Fleet />
      case 'analytics': return <Analytics />
      case 'rules': return <Rules />
      case 'audit': return <AuditLog />
      case 'export': return <DataPage />
      default: return <Dashboard onNavigate={setPage} onNewEntry={openNewEntry} />
    }
  }
}

export default function App() {
  return <AppProvider><AppContent /></AppProvider>
}
