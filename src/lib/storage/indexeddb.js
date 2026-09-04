// storage/indexeddb.js
// Typed IndexedDB store with versioned migrations + automatic backups.
// Wraps the whole store payload in a single document, plus dedicated backup records.
//
// Object stores:
//   meta   key 'store'                     -> { schemaVersion, store {...} }
//   backups key 'backups' (auto id)        -> Backup records
//
// In the prototype the primary data is kept as one document to guarantee
// atomic reads/writes and trivial migrations; a future phase can shard entries
// into their own store + indexes for large fleets (see ADVANCEMENT.md §6).
import { SCHEMA_VERSION } from '@/domain/model.js'

const DB_NAME = 'marlog_orb'
const MIGRATIONS = {
  1: async (tx) => {
    const meta = tx.objectStore('meta')
    const cur = await getById('meta', 'store')
    // existing v2 localStorage data is migrated by the caller (adapter) before
    // first write; this migration simply stamps the current version.
    return { ...(cur || {}), schemaVersion: 1 }
  },
  2: async (tx, current) => ({ ...current, schemaVersion: 2 }),
  3: async (tx, current) => ({ ...current, schemaVersion: 3 }),
}

function openDB() {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB unavailable'))
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' })
      if (!db.objectStoreNames.contains('backups')) db.createObjectStore('backups', { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('IndexedDB blocked'))
  })
}

function wrap(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function txGet(tx, storeName, key) {
  const store = tx.objectStore(storeName)
  const result = await wrap(store.get(key))
  return result
}

async function txPut(tx, storeName, value) {
  const store = tx.objectStore(storeName)
  await wrap(store.put(value))
}

async function withReadWrite(fn) {
  const db = await openDB()
  const tx = db.transaction(['meta', 'backups'], 'readwrite')
  try {
    const result = await fn(tx)
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = reject
      tx.onabort = reject
    })
    db.close()
    return result
  } catch (err) {
    tx.abort()
    db.close()
    throw err
  }
}

async function getById(storeName, key) {
  const db = await openDB()
  try {
    return await txGet(db.transaction(storeName, 'readonly'), storeName, key)
  } finally {
    db.close()
  }
}

export async function loadStore() {
  const rec = await getById('meta', 'store')
  return rec ? { schemaVersion: rec.schemaVersion, store: rec.store, updatedAt: rec.updatedAt } : null
}

export async function saveStore(store, meta = {}) {
  const record = { key: 'store', store, schemaVersion: SCHEMA_VERSION, updatedAt: new Date().toISOString(), ...meta }
  await withReadWrite((tx) => txPut(tx, 'meta', record))
  return record
}

// --- backups --------------------------------------------------------------
export async function writeBackup(backup) {
  const id = backup.id ||
    `backup_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  const record = { id, at: new Date().toISOString(), ...backup }
  await withReadWrite((tx) => txPut(tx, 'backups', record))
  return record
}

export async function listBackups() {
  const db = await openDB()
  try {
    const all = await wrap(db.transaction('backups', 'readonly').objectStore('backups').getAll())
    return (all || []).sort((a, b) => String(b.at).localeCompare(String(a.at)))
  } finally {
    db.close()
  }
}

export async function getBackup(id) {
  return getById('backups', id)
}

// Before a schema migration or a destructive action we snapshot the current data.
export async function snapshotBefore(store, kind = 'auto') {
  // Only useful if we already have a doc to snapshot.
  const current = await loadStore()
  if (!current) return null
  return writeBackup({ kind, dataVersion: current.schemaVersion, payload: current.store })
}

export { MIGRATIONS }
