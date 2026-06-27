import { DEFAULT_ENTRY_TEMPLATES } from './marpolOperations.js'
const STORAGE_KEY = 'marlog_orb_data'
const hasLocalStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
const defaultVessel = {
  id: 'vessel_default',
  vessel_name: '',
  imo_number: '',
  flag_state: '',
  gross_tonnage: 0,
  vessel_type: 'oil_tanker',
  oily_water_separator_capacity: 0,
  oil_content_monitor_type: '',
  incinerator_capacity: 0,
  slop_tank_capacity: 0,
  sludge_tank_capacity: 0,
  bilge_tank_capacity: 0,
  createdAt: new Date().toISOString()
}
function getDefaultData() {
  return { vessel: defaultVessel, entries: [], templates: DEFAULT_ENTRY_TEMPLATES, lastEntryNumber: 0 }
}
export function loadData() {
  try {
    if (!hasLocalStorage()) return getDefaultData()
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      const mergedTemplates = [...DEFAULT_ENTRY_TEMPLATES]
      data.templates?.forEach(t => {
        if (!mergedTemplates.find(mt => mt.id === t.id)) mergedTemplates.push(t)
      })
      return { ...getDefaultData(), ...data, templates: mergedTemplates }
    }
    return getDefaultData()
  } catch (e) { console.error('Failed to load data:', e); return getDefaultData() }
}
export function saveData(data) {
  try { if (!hasLocalStorage()) return false; localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true }
  catch (e) { console.error('Failed to save data:', e); return false }
}
export function exportToJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `MarLog_ORB_Export_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}
export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try { resolve(JSON.parse(e.target.result)) }
      catch (err) { reject(new Error('Invalid JSON file')) }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
export function clearAllData() {
  if (hasLocalStorage()) localStorage.removeItem(STORAGE_KEY)
  return getDefaultData()
}
