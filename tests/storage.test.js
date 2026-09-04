import { describe, it, expect, beforeAll } from 'vitest'
import 'fake-indexeddb/auto'
import { emptyStore } from '@/domain/model.js'
import * as idb from '@/lib/storage/indexeddb.js'

describe('storage (fake-indexeddb)', () => {
  let store
  beforeAll(() => {
    store = emptyStore()
    store.vessels[0].name = 'MT Test Ship'
  })

  it('saves and loads the store round-trip', async () => {
    await idb.saveStore(store)
    const loaded = await idb.loadStore()
    expect(loaded).toBeTruthy()
    expect(loaded.store.vessels[0].name).toBe('MT Test Ship')
    expect(loaded.schemaVersion).toBe(3)
  })

  it('creates and lists backups', async () => {
    await idb.saveStore(store)
    await idb.writeBackup({ kind: 'preMigration', dataVersion: 2, payload: store })
    await idb.writeBackup({ kind: 'manual', dataVersion: 3, payload: store })
    const backups = await idb.listBackups()
    expect(backups.length).toBeGreaterThanOrEqual(2)
    // sorted most-recent first
    expect(backups[0].at >= backups[backups.length - 1].at).toBe(true)
  })

  it('fetches a specific backup', async () => {
    const b = await idb.writeBackup({ kind: 'manual', dataVersion: 3, payload: store })
    const got = await idb.getBackup(b.id)
    expect(got.id).toBe(b.id)
  })
})
