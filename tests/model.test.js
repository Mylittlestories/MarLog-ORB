import { describe, it, expect } from 'vitest'
import {
  fromLegacyV2, emptyStore, createVessel, createEntry,
  currentVessel, entriesForVessel, tanksForVessel, SCHEMA_VERSION,
} from '@/domain/model.js'

describe('domain model', () => {
  it('migrates a legacy v2 payload into a v3 fleet store', () => {
    const legacy = {
      vessel: {
        vessel_name: 'MT Ocean Pioneer', imo_number: '9212345', flag_state: 'Panama',
        gross_tonnage: 15000, vessel_type: 'oil_tanker',
        slop_tank_capacity: 100, sludge_tank_capacity: 20, bilge_tank_capacity: 50,
      },
      entries: [
        { id: 'e1', entry_number: 1, operation_code: 'G', item_number: '4',
          record_of_operation: 'test', quantity_m3: 10, date: '2026-01-01', time_utc: '12:00',
          position_lat: '30', position_lon: '-40', ship_speed_knots: 12,
          signed_by: 'Doe', rank: 'Chief Engineer' },
      ],
      templates: [{ id: 't1', name: 'x' }],
      lastEntryNumber: 1,
    }
    const store = fromLegacyV2(legacy)
    expect(store.schemaVersion).toBe(SCHEMA_VERSION)
    expect(store.vessels).toHaveLength(1)
    expect(store.vessels[0].name).toBe('MT Ocean Pioneer')
    expect(store.vessels[0].imo).toBe('9212345')
    expect(store.vessels[0].vesselType).toBe('oilTanker')
    // capacities promoted to tank registry
    expect(store.tanks.map((t) => t.kind).sort()).toEqual(['bilge', 'slop', 'sludge'])
    // entry normalised
    expect(store.entries[0].position).toEqual({ lat: '30', lon: '-40' })
    expect(store.entries[0].operationCode).toBe('G')
  })

  it('builtins create well-formed entities', () => {
    const v = createVessel({ name: 'A' })
    const e = createEntry({ vesselId: v.id, operation_code: 'C' })
    expect(e.vesselId).toBe(v.id)
    expect(e.operationCode).toBe('C')
    expect(e.status).toBe('active')
    expect(e.statusHistory).toHaveLength(1)
  })

  it('handles an empty legacy payload', () => {
    const store = fromLegacyV2()
    expect(store.vessels).toHaveLength(1)
    expect(store.entries).toEqual([])
  })

  it('emptyStore and selectors work', () => {
    const store = emptyStore()
    expect(currentVessel(store)).toBeTruthy()
    expect(entriesForVessel(store)).toEqual([])
    expect(tanksForVessel(store)).toEqual([])
    expect(store.vessels[0].id).toBe(store.activeVesselId)
  })
})
