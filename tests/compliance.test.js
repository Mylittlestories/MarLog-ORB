import { describe, it, expect } from 'vitest'
import { validateEntry, SEVERITY } from '@/lib/compliance/regulations.js'

const baseCtx = { tanks: [], equipment: [] }

describe('compliance engine', () => {
  it('passes a clean overboard discharge', () => {
    const entry = {
      operationCode: 'G', itemNumber: '4', dischargeOverboard: true,
      ppmReading: 8, speedKnots: 12, quantityM3: 10,
      position: { lat: '30', lon: '-40' },
    }
    const { worstSeverity } = validateEntry(entry, baseCtx)
    expect(worstSeverity).not.toBe(SEVERITY.BLOCKED)
  })

  it('blocks sludge discharge overboard', () => {
    const entry = { operationCode: 'E', itemNumber: '1', dischargeOverboard: true, quantityM3: 5 }
    const { worstSeverity, findings } = validateEntry(entry, baseCtx)
    expect(worstSeverity).toBe(SEVERITY.BLOCKED)
    expect(findings.find((f) => f.ruleId === 'sludge_never_overboard')).toBeTruthy()
  })

  it('blocks ppm over 15', () => {
    const entry = {
      operationCode: 'D', itemNumber: '3', dischargeOverboard: true,
      ppmReading: 18, speedKnots: 10, quantityM3: 20,
      position: { lat: '12', lon: '-80' },
    }
    const { worstSeverity, findings } = validateEntry(entry, baseCtx)
    expect(worstSeverity).toBe(SEVERITY.BLOCKED)
    expect(findings.find((f) => f.ruleId === 'ppm_15_limit')).toBeTruthy()
  })

  it('warns when overboard in a special area', () => {
    // Position in the Mediterranean (approx polygon).
    const entry = {
      operationCode: 'G', itemNumber: '4', dischargeOverboard: true,
      ppmReading: 10, speedKnots: 12, quantityM3: 10,
      position: { lat: '38', lon: '15' },
    }
    const { findings } = validateEntry(entry, baseCtx)
    const special = findings.find((f) => f.ruleId === 'special_area_discharge')
    expect(special).toBeTruthy()
    expect(special.severity).toBe(SEVERITY.WARNING)
  })

  it('blocks discharge missing position', () => {
    const entry = { operationCode: 'C', itemNumber: '3', dischargeOverboard: true, quantityM3: 5, speedKnots: 10 }
    const { worstSeverity } = validateEntry(entry, baseCtx)
    expect(worstSeverity).toBe(SEVERITY.BLOCKED)
  })

  it('flags tank capacity exceeded', () => {
    const tanks = [{ id: 't1', name: 'Slop Tank', capacityM3: 10 }]
    const entry = { operationCode: 'F', itemNumber: '2', tankIds: ['t1'], quantityM3: 15 }
    const { worstSeverity, findings } = validateEntry(entry, { tanks, equipment: [] })
    expect(findings.find((f) => f.ruleId === 'tank_capacity_exceeded')).toBeTruthy()
  })

  it('does not throw on missing fields', () => {
    expect(() => validateEntry({}, baseCtx)).not.toThrow()
  })

  it('warns on correction without countersignature', () => {
    const entry = { status: 'corrected' }
    const { findings } = validateEntry(entry, baseCtx)
    expect(findings.find((f) => f.ruleId === 'countersignature_correction')).toBeTruthy()
  })
})
