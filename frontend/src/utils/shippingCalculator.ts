import type { CustomerAddress } from '../api/usersApi'

export interface UnivalleShippingZone {
  id: string
  name: string
  areaDescription: string
  defaultDistanceKm: number
  baseFee: number
}

export const UNIVALLE_SHIPPING_ZONES: UnivalleShippingZone[] = [
  {
    id: 'campus-melendez',
    name: 'Campus Univalle Meléndez (Interno)',
    areaDescription: 'Entrega dentro del Campus Meléndez · Edificios y facultades',
    defaultDistanceKm: 1,
    baseFee: 2000,
  },
  {
    id: 'zona-sur',
    name: 'Zona Sur Cali (Cercano a Univalle)',
    areaDescription: 'Ciudad Jardín, Valle del Lili, Unicentro, Ingenio, Bochalema, Caney',
    defaultDistanceKm: 3.5,
    baseFee: 2500,
  },
  {
    id: 'campus-san-fernando',
    name: 'Campus San Fernando / Sur-Centro',
    areaDescription: 'Facultad de Salud, San Fernando, Tequendama, Estadio, Miraflores',
    defaultDistanceKm: 6.5,
    baseFee: 2500,
  },
  {
    id: 'zona-centro-oeste',
    name: 'Zona Centro / Oeste / Oriente Cali',
    areaDescription: 'San Antonio, Peñón, Granada, Centro, Alfonso López, Calipso',
    defaultDistanceKm: 9.5,
    baseFee: 3000,
  },
  {
    id: 'zona-norte',
    name: 'Zona Norte de Cali',
    areaDescription: 'Chipichape, La Flora, Versalles, Salomia, Menga, Sameco',
    defaultDistanceKm: 14,
    baseFee: 3500,
  },
  {
    id: 'area-metropolitana',
    name: 'Área Metropolitana (Fuera de Cali)',
    areaDescription: 'Jamundí, Yumbo, Palmira, Candelaria',
    defaultDistanceKm: 22,
    baseFee: 4500,
  },
]

const COST_PER_KM_COP = 600

export interface ShippingCalculationResult {
  zoneId: string
  zoneName: string
  distanceKm: number
  shippingCost: number
  formulaText: string
}

/**
 * Calculates shipping cost based on distance (km) from Univalle Campus.
 * More distance -> higher shipping cost.
 */
export function calculateShippingByDistance(
  distanceKm: number,
  zoneId = 'zona-sur',
): ShippingCalculationResult {
  const zone =
    UNIVALLE_SHIPPING_ZONES.find((z) => z.id === zoneId) ??
    UNIVALLE_SHIPPING_ZONES[1]
  const safeKm = Math.max(0.5, Math.min(45, Number(distanceKm) || zone.defaultDistanceKm))
  const rawCost = zone.baseFee + safeKm * COST_PER_KM_COP
  const roundedCost = Math.round(rawCost / 100) * 100

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    distanceKm: Number(safeKm.toFixed(1)),
    shippingCost: roundedCost,
    formulaText: `${Number(safeKm.toFixed(1))} km desde Univalle (${zone.name})`,
  }
}

/**
 * Formats address details including distance metadata so it persists in user-service
 */
export function formatAddressDetailsWithDistance(
  rawDetails: string,
  zoneId: string,
  distanceKm: number,
): string {
  const clean = rawDetails.replace(/\s*\[Envío:[^\]]+\]\s*$/i, '').trim()
  const calc = calculateShippingByDistance(distanceKm, zoneId)
  const tag = `[Envío: ${calc.zoneName} · ${calc.distanceKm} km]`
  return clean ? `${clean} ${tag}` : tag
}

/**
 * Extracts or infers the distance and shipping cost from a CustomerAddress
 */
export function calculateShippingForAddress(
  address: CustomerAddress | null | undefined,
): ShippingCalculationResult {
  if (!address) {
    return calculateShippingByDistance(3.5, 'zona-sur')
  }

  const combined = `${address.label} ${address.address} ${address.details || ''}`

  // 1. Check if explicit [Envío: ... · X km] tag is present
  const explicitMatch = combined.match(/\[Envío:\s*([^·\]]+)\s*·\s*([\d.]+)\s*km\]/i)
  if (explicitMatch) {
    const zoneNamePart = explicitMatch[1].trim().toLowerCase()
    const km = parseFloat(explicitMatch[2])
    const matchedZone =
      UNIVALLE_SHIPPING_ZONES.find((z) =>
        z.name.toLowerCase().includes(zoneNamePart),
      ) ?? UNIVALLE_SHIPPING_ZONES[1]
    return calculateShippingByDistance(km, matchedZone.id)
  }

  // 2. Otherwise infer from address keywords
  const lower = combined.toLowerCase()
  if (lower.includes('melendez') || lower.includes('meléndez') || lower.includes('e20')) {
    return calculateShippingByDistance(1, 'campus-melendez')
  }
  if (lower.includes('san fernando') || lower.includes('tequendama') || lower.includes('estadio')) {
    return calculateShippingByDistance(6.5, 'campus-san-fernando')
  }
  if (
    lower.includes('jamundi') ||
    lower.includes('jamundí') ||
    lower.includes('palmira') ||
    lower.includes('yumbo') ||
    lower.includes('candelaria')
  ) {
    return calculateShippingByDistance(22, 'area-metropolitana')
  }
  if (
    lower.includes('norte') ||
    lower.includes('flora') ||
    lower.includes('chipichape') ||
    lower.includes('salomia') ||
    lower.includes('menga')
  ) {
    return calculateShippingByDistance(14, 'zona-norte')
  }
  if (
    lower.includes('centro') ||
    lower.includes('san antonio') ||
    lower.includes('granada') ||
    lower.includes('oeste')
  ) {
    return calculateShippingByDistance(9.5, 'zona-centro-oeste')
  }

  return calculateShippingByDistance(3.5, 'zona-sur')
}
