import { describe, it, expect, beforeEach } from 'vitest'
import { reducer, createInitialStore, currentVessel, entriesFor, STATUS } from '@/lib/store.js'

describe('store reducer', () => {
  let state
  beforeEach(() => {
    state = createInitialStore(null)
  })

  it('boots a fresh store with one default vessel', () => {
    expect(currentVessel(state)).toBeTruthy()
    expect(state.entries).toEqual([])
    expect(state.templates.length).toBeGreaterThan(0)
  })

  it('adds a vessel and switches active', () => {
    state = reducer(state, { type: 'ADD_VESSEL', payload: { name: 'MT Two' } })
    expect(state.vessels.length).toBe(2)
    expect(currentVessel(state).name).toBe('MT Two')
  })

  it('adds an entry with an auto entry number', () => {
    state = reducer(state, { type: 'ADD_ENTRY', payload: { date: '2026-01-01', operationCode: 'G', itemNumber: '4', recordOfOperation: 'test', signedBy: 'A', rank: 'Chief Engineer' } })
    expect(state.entries).toHaveLength(1)
    expect(state.entries[0].entryNumber).toBe(1)
    expect(state.entries[0].status).toBe('active')
    expect(state.audit.length).toBe(1)
  })

  it('correction voids original and creates a referenced corrected entry', () => {
    state = reducer(state, { type: 'ADD_ENTRY', payload: { date: '2026-01-01', operationCode: 'G', itemNumber: '4', recordOfOperation: 'bad', signedBy: 'A', rank: 'Chief Engineer' } })
    const original = state.entries[0]
    state = reducer(state, {
      type: 'ADD_CORRECTION',
      payload: {
        entryId: original.id, reason: 'wrong quantity', correctedBy: 'B',
        corrected: { date: original.date, timeUtc: original.timeUtc, operationCode: original.operationCode, itemNumber: original.itemNumber, recordOfOperation: 'good', signedBy: 'B', rank: 'Chief Engineer' },
      },
    })
    const originalAfter = state.entries.find((e) => e.id === original.id)
    expect(originalAfter.status).toBe('void')
    expect(originalAfter.voidReason).toBe('wrong quantity')
    const corrected = state.entries.find((e) => e.correctedFrom === original.id)
    expect(corrected).toBeTruthy()
    expect(corrected.recordOfOperation).toBe('good')
    expect(corrected.entryNumber).toBe(2)
    // cross-reference preserved
    expect(corrected.correctedFrom).toBe(original.id)
    expect(originalAfter.correctedById).toBe(corrected.id)
  })

  it('adds tanks, equipment and crew scoped to vessel', () => {
    const vid = currentVessel(state).id
    state = reducer(state, { type: 'ADD_TANK', vesselId: vid, payload: { kind: 'slop', name: 'Slop Tank', capacityM3: 100 } })
    state = reducer(state, { type: 'ADD_EQUIPMENT', vesselId: vid, payload: { kind: 'ocs', model: 'M' } })
    state = reducer(state, { type: 'ADD_CREW', vesselId: vid, payload: { name: 'Doe', rank: 'Chief Engineer' } })
    expect(state.tanks).toHaveLength(1)
    expect(state.equipment).toHaveLength(1)
    expect(state.crew).toHaveLength(1)
  })

  it('audit recording can be disabled', () => {
    state = { ...state, auditEnabled: false }
    state = reducer(state, { type: 'ADD_ENTRY', payload: { date: '2026-01-01', operationCode: 'G', itemNumber: '4', recordOfOperation: 'x', signedBy: 'A', rank: 'Chief Engineer' } })
    expect(state.audit.length).toBe(0)
  })
})
