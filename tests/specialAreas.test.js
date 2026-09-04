import { describe, it, expect } from 'vitest'
import { specialAreaAt, pointInPolygon, distanceToLandKm, kmToNm } from '@/lib/compliance/specialAreas.js'

describe('special areas', () => {
  it('detects Mediterranean (Aegean)', () => {
    const area = specialAreaAt({ lat: '38', lon: '25' })
    expect(area).toBeTruthy()
    expect(area.name).toMatch(/Mediterranean/)
  })

  it('detects Antarctic (south of 60S)', () => {
    expect(specialAreaAt({ lat: '-65', lon: '0' }).name).toBe('Antarctic area')
  })

  it('detects Baltic', () => {
    expect(specialAreaAt({ lat: '58', lon: '20' }).name).toBe('Baltic Sea')
  })

  it('returns null outside special areas (mid-Atlantic)', () => {
    expect(specialAreaAt({ lat: '0', lon: '-40' })).toBeNull()
  })

  it('handles invalid positions gracefully', () => {
    expect(specialAreaAt(null)).toBeNull()
    expect(specialAreaAt({ lat: '', lon: '' })).toBeNull()
  })

  it('pointInPolygon basic containment', () => {
    const poly = [[0, 0], [10, 0], [10, 10], [0, 10]]
    expect(pointInPolygon(poly, 5, 5)).toBe(true)
    expect(pointInPolygon(poly, 20, 20)).toBe(false)
  })

  it('distance to land is a positive finite km and converts to nm', () => {
    const km = distanceToLandKm({ lat: '-30', lon: '-40' }) // far from our coast samples
    expect(km).toBeGreaterThan(0)
    expect(kmToNm(km)).toBeGreaterThan(0)
  })
})
