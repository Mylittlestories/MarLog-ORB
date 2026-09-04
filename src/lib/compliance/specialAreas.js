// compliance/specialAreas.js
// MARPOL special-area detection. Pure functions. The prototype ships polygon
// approximations for the major Annex I special areas; a production build should
// upgrade this to an exact offline coastline polygon dataset (Natural Earth /
// WVS) — the call surface does not change.
//
// Special-area list (MARPOL Annex I Reg 1.11 / Reg 10 and Annex V/IV equivalents):
//  - Mediterranean Sea
//  - Baltic Sea
//  - Black Sea
//  - Red Sea
//  - "Gulfs" area (Persian Gulf / Arabian Gulf)
//  - Gulf of Aden
//  - Antarctic area (south of 60°S)
//  - North West European Waters (North Sea + English Channel)
//  - Wider Caribbean region
//
// Coordinates are [lon, lat]. A polygon is an array of [lon,lat] vertices.

const ANTARCTIC = { name: 'Antarctic area', note: 'south of 60°S', polygons: [[[-180, -90], [180, -90], [180, -60], [-180, -60]]] }

const MEDITERRANEAN = {
  name: 'Mediterranean Sea', note: 'incl. Adriatic and Aegean',
  polygons: [[
    [-6, 36], [-6, 36], [-0.5, 36.1], [10, 37], [18, 37.5], [28, 36.5], [36, 36],
    [36, 37], [32, 43], [26, 44], [20, 44.5], [14, 44.8], [8, 43.8], [3, 42.5],
    [-2, 40], [-6, 38], [-6, 36],
  ]],
  // Aegean (approx)
  extra: [[[20, 35], [28, 35], [28, 41], [20, 41], [20, 35]]],
}

const BALTIC = {
  name: 'Baltic Sea', note: 'incl. Gulf of Bothnia, Gulf of Finland, Gulf of Riga',
  polygons: [[[9, 57], [22, 54], [28, 54.5], [30, 60], [26, 66], [19, 59], [9, 57]]],
}

const BLACK_SEA = {
  name: 'Black Sea',
  polygons: [[[27, 41], [41, 41], [41, 47], [27, 47], [27, 41]]],
}

const RED_SEA = {
  name: 'Red Sea',
  polygons: [[[32, 15], [44, 12], [44, 30], [34, 30], [32, 15]]],
}

const GULFS = {
  name: 'Gulfs area', note: 'Persian Gulf / Arabian Gulf',
  polygons: [[[48, 24], [58, 23.5], [58.5, 27], [50, 30.5], [48, 24]]],
}

const GULF_OF_ADEN = {
  name: 'Gulf of Aden', note: 'incl. approaches up to 50 nm east',
  polygons: [[[41, 11], [52, 11], [53, 15], [43, 15], [41, 11]]],
}

const NORTH_WEST_EUROPEAN = {
  name: 'North West European Waters', note: 'North Sea + English Channel + approaches',
  polygons: [[[-8, 48], [3, 51], [9, 57], [7, 61], [2, 61], [-4, 58], [-8, 48]]],
}

const WIDER_CARIBBEAN = {
  name: 'Wider Caribbean region',
  polygons: [[[-90, 9], [-60, 9], [-58, 18], [-88, 22], [-90, 9]]],
}

export const SPECIAL_AREAS = [
  ANTARCTIC, MEDITERRANEAN, BALTIC, BLACK_SEA, RED_SEA, GULFS, GULF_OF_ADEN,
  NORTH_WEST_EUROPEAN, WIDER_CARIBBEAN,
]

// Standard IMO low-water coastline sample (approx.) used for a crude
// distance-to-land estimate. Production should swap to an offline dataset.
const COAST_POINTS = [
  [-6, 36.0], [-0.5, 36.1], [10, 37], [18, 37.5], [28, 36.5], [36, 36],
  [32, 43], [26, 44], [20, 44.5], [14, 44.8], [8, 43.8], [3, 42.5],
  [9, 57], [22, 54], [28, 54.5], [30, 60], [26, 66], [19, 59],
  [27, 41], [41, 41], [41, 47], [27, 47],
  [48, 24], [58, 23.5], [58.5, 27], [50, 30.5],
  [41, 11], [52, 11], [53, 15], [43, 15],
  [-8, 48], [3, 51], [9, 57],
  [-90, 9], [-60, 9], [-58, 18], [-88, 22],
]

// --- geometry -------------------------------------------------------------
function polygonContains(polygon, lon, lat) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0]; const yi = polygon[i][1]
    const xj = polygon[j][0]; const yj = polygon[j][1]
    const intersects = (yi > lat) !== (yj > lat) &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

export function pointInPolygon(polygon, lon, lat) {
  return polygonContains(polygon, Number(lon), Number(lat))
}

export function haversineKm(lonA, latA, lonB, latB) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(latB - latA)
  const dLon = toRad(lonB - lonA)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/**
 * @param {{lon:string|number, lat:string|number}|null} position
 * @returns {{name:string, note?:string, polygons:...}|null}
 */
export function specialAreaAt(position) {
  if (!position) return null
  const lon = Number(position.lon); const lat = Number(position.lat)
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null
  for (const area of SPECIAL_AREAS) {
    const polys = area.polygons.concat(area.extra || [])
    if (polys.some((p) => pointInPolygon(p, lon, lat))) return area
  }
  return null
}

/** Crude distance (km) to the sampled coastline. Approximation for the prototype. */
export function distanceToLandKm(position) {
  if (!position) return null
  const lon = Number(position.lon); const lat = Number(position.lat)
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null
  let min = Infinity
  for (const [clon, clat] of COAST_POINTS) {
    const d = haversineKm(lon, lat, clon, clat)
    if (d < min) min = d
  }
  return Number.isFinite(min) ? min : null
}

export const NM_PER_KM = 0.539957
export function kmToNm(km) { return km == null ? null : km * NM_PER_KM }
