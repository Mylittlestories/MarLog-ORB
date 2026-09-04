// storage/adapter.js
// Unified persistence interface. IndexedDB primary, localStorage fallback.
// Views never touch a backend directly — they go through this module.
import * as idb from './indexeddb.js'
import { SCHEMA_VERSION } from '@/domain/model.js'

const LS_KEY = 'marlog_orb_data'

const lsAvailable = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

function lsRead() {
  if (!lsAvailable()) return null
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}
function lsWrite(payload) {
  if (!lsAvailable()) return false
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

/** Load a raw v3 store document from IDB (or null). */
export async function loadStore() {
  try {
    const rec = await idb.loadStore()
    return rec && rec.store ? rec.store : null
  } catch {
    return null
  }
}

/** Read the raw legacy localStorage payload (v2 shape), if any. */
export function loadLegacyLocal() {
  const raw = lsRead()
  if (!raw) return null
  // A v3 store doc has a `schemaVersion` and `vessels`; legacy has `vessel`.
  if (raw && (raw.vessels || raw.schemaVersion >= 3)) return null
  return raw
}

export async function saveStore(store) {
  const record = { schemaVersion: SCHEMA_VERSION, store, updatedAt: new Date().toISOString() }
  try {
    await idb.saveStore(store)
    lsWrite(record) // keep localStorage as a mirror/cached copy
    return true
  } catch {
    return lsWrite(record)
  }
}

export async function createSnapshot(store, kind = 'manual') {
  try {
    return await idb.writeBackup({ kind, dataVersion: SCHEMA_VERSION, payload: store })
  } catch {
    return null
  }
}

export async function listSnapshots() {
  try {
    return await idb.listBackups()
  } catch {
    return []
  }
}

export async function getSnapshot(id) {
  try {
    return await idb.getBackup(id)
  } catch {
    return null
  }
}

export function clearLocal() {
  if (lsAvailable()) localStorage.removeItem(LS_KEY)
}

export { LS_KEY }
