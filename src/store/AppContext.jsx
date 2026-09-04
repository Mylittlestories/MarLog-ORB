// store/AppContext.jsx
// React provider: loads via the persistence adapter (migrating legacy data),
// runs the v3 reducer, persists on change, and exposes selectors + dispatch.
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { reducer, createInitialStore } from '@/lib/store.js'
import { loadStore, saveStore, loadLegacyLocal, createSnapshot } from '@/lib/storage/adapter.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => ({}))
  const [ready, setReady] = useState(false)
  const [migrationNote, setMigrationNote] = useState(null)
  const booting = useRef(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const stored = await loadStore()
        if (stored) {
          dispatch({ type: 'LOAD_STORE', payload: { ...stored, auditEnabled: true } })
        } else {
          const legacy = loadLegacyLocal()
          const initial = createInitialStore(legacy)
          if (legacy) {
            await createSnapshot(initial, 'preMigration').catch(() => {})
            setMigrationNote('Legacy data migrated to the new fleet-ready store.')
          }
          dispatch({ type: 'LOAD_STORE', payload: initial })
        }
      } catch {
        dispatch({ type: 'LOAD_STORE', payload: createInitialStore(null) })
      } finally {
        if (!cancelled) { booting.current = false; setReady(true) }
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!ready || booting.current || !state.vessels) return
    saveStore(state)
  }, [state, ready])

  const value = useMemo(() => ({ state, dispatch, ready, migrationNote, setMigrationNote }), [state, ready, migrationNote])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be within AppProvider')
  return ctx
}
