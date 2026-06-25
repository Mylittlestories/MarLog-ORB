import { AppProvider, useApp } from '@/context/AppContext.jsx'
import { Sidebar } from '@/components/features/Sidebar.jsx'
import { Dashboard } from '@/pages/Dashboard.jsx'
import { VesselProfile } from '@/pages/VesselProfile.jsx'
import { EntryList } from '@/pages/EntryList.jsx'
import { EntryForm } from '@/pages/EntryForm.jsx'
import { Templates } from '@/pages/Templates.jsx'
import { Export } from '@/pages/Export.jsx'
import { useState } from 'react'

function AppContent() {
  const { state } = useApp()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [editingEntry, setEditingEntry] = useState(null)

  const handleEditEntry = (entry) => {
    setEditingEntry(entry)
    setCurrentPage('entry-form')
  }

  const handleNewEntry = () => {
    setEditingEntry(null)
    setCurrentPage('entry-form')
  }

  const handleCloseForm = () => {
    setEditingEntry(null)
    setCurrentPage('entries')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} onNewEntry={handleNewEntry} />
      case 'vessel':
        return <VesselProfile />
      case 'entries':
        return <EntryList onEditEntry={handleEditEntry} onNewEntry={handleNewEntry} />
      case 'entry-form':
        return <EntryForm entry={editingEntry} onClose={handleCloseForm} onNavigate={setCurrentPage} />
      case 'templates':
        return <Templates />
      case 'export':
        return <Export />
      default:
        return <Dashboard onNavigate={setCurrentPage} onNewEntry={handleNewEntry} />
    }
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} vessel={state.vessel} />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
