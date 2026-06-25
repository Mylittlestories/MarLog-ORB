import { createContext, useContext, useReducer, useEffect } from 'react'
import { loadData, saveData } from '@/data/initialData.js'
import { generateEntryNumber } from '@/lib/utils.js'

const AppContext = createContext(null)
const initialState = loadData()

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_VESSEL':
      return { ...state, vessel: { ...state.vessel, ...action.payload } }
    case 'ADD_ENTRY': {
      const newEntry = {
        ...action.payload, id: generateEntryNumber(),
        entry_number: state.lastEntryNumber + 1, status: 'active',
        vessel_name: state.vessel.vessel_name, createdAt: new Date().toISOString()
      }
      return { ...state, entries: [newEntry, ...state.entries], lastEntryNumber: state.lastEntryNumber + 1 }
    }
    case 'UPDATE_ENTRY':
      return { ...state, entries: state.entries.map(e => e.id === action.payload.id ? { ...e, ...action.payload } : e) }
    case 'CORRECT_ENTRY':
      return { ...state, entries: state.entries.map(e => e.id === action.payload.entryId ? { ...e, status: 'corrected', correction_note: action.payload.correctionNote, corrected_by: action.payload.correctedBy, correction_date: action.payload.correctionDate } : e) }
    case 'VOID_ENTRY':
      return { ...state, entries: state.entries.map(e => e.id === action.payload.entryId ? { ...e, status: 'void', corrected_entry_id: action.payload.correctedEntryId } : e) }
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, { ...action.payload, id: generateEntryNumber(), use_count: 0 }] }
    case 'UPDATE_TEMPLATE':
      return { ...state, templates: state.templates.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) }
    case 'DELETE_TEMPLATE':
      return { ...state, templates: state.templates.filter(t => t.id !== action.payload) }
    case 'INCREMENT_TEMPLATE_USAGE':
      return { ...state, templates: state.templates.map(t => t.id === action.payload ? { ...t, use_count: (t.use_count || 0) + 1 } : t) }
    case 'IMPORT_DATA':
      return { ...loadData(), ...action.payload }
    case 'CLEAR_ALL':
      return loadData()
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  useEffect(() => { saveData(state) }, [state])
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be within AppProvider')
  return context
}
