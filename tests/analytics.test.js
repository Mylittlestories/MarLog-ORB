import { describe, it, expect } from 'vitest'
import { fromLegacyV2 } from '@/domain/model.js'
import {
  monthlyQuantities, disposalSummary, sludgeGenerationRatePerDay,
  disposalEfficiency, countsByOperation,
} from '@/lib/analytics/engine.js'

function buildStore() {
  const ship = { vessel_name: 'MT Ship', vessel_type: 'oil_tanker', slop_tank_capacity: 100 }
  const entries = [
    // bilge discharge to sea: 10 m3 (overboard)
    create('G', '4', 10, '2026-01-05', true),
    // sludge to reception: 5 m3
    create('E', '1', 5, '2026-01-20', false),
    // sludge incinerated: 2 m3
    create('E', '3', 2, '2026-02-02', false),
    // ballast received: 40 m3
    create('B', '1', 40, '2026-02-10', false),
  ]
  function create(code, item, q, date, overboard) {
    return { operation_code: code, item_number: item, quantity_m3: q, date, dischargeOverboard: overboard }
  }
  return fromLegacyV2({ vessel: ship, entries })
}

describe('analytics engine', () => {
  it('monthly quantities aggregate per month', () => {
    const store = buildStore()
    const q = monthlyQuantities(store)
    expect(q).toEqual([
      { month: '2026-01', m3: 15 },
      { month: '2026-02', m3: 42 },
    ])
  })

  it('disposal summary categorises correctly', () => {
    const store = buildStore()
    const s = disposalSummary(store)
    expect(s.dischargedToSeaM3).toBe(10)
    expect(s.receivedShoreM3).toBe(5)
    expect(s.incineratedM3).toBe(2)
    expect(s.ballastReceivedM3).toBe(40)
    expect(s.entries).toBe(4)
  })

  it('disposal efficiency percentages', () => {
    const s = disposalEfficiency(buildStore())
    expect(s).toBeCloseTo((7 / 17) * 100, 0)
  })

  it('sludge generation rate', () => {
    const rate = sludgeGenerationRatePerDay(buildStore())
    expect(rate).toBeGreaterThan(0)
    expect(rate).toBeLessThan(1)
  })

  it('counts by operation', () => {
    const c = countsByOperation(buildStore())
    expect(c).toEqual({ G: 1, E: 2, B: 1 })
  })
})
