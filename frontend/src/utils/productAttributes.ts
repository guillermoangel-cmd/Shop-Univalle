export type CategoryTemplateType =
  | 'clothing'
  | 'books'
  | 'tech'
  | 'accessories'
  | 'general'

export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
export const ACCESSORY_SIZES = ['Única', 'Ajustable', 'Pequeño', 'Mediano', 'Grande']

export interface ParsedProductMetadata {
  cleanDescription: string
  sizes: string[]
  specs: { label: string; value: string }[]
  rawAttributes: Record<string, string>
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function detectCategoryTemplate(categoryName: string): CategoryTemplateType {
  const n = normalize(categoryName)
  if (
    n.includes('ropa') ||
    n.includes('camiseta') ||
    n.includes('sudadera') ||
    n.includes('moda') ||
    n.includes('textil') ||
    n.includes('calzado') ||
    n.includes('prenda') ||
    n.includes('uniforme')
  ) {
    return 'clothing'
  }
  if (
    n.includes('libro') ||
    n.includes('papeleria') ||
    n.includes('academico') ||
    n.includes('cuaderno') ||
    n.includes('revista') ||
    n.includes('lectura')
  ) {
    return 'books'
  }
  if (
    n.includes('tecnologia') ||
    n.includes('electronica') ||
    n.includes('computo') ||
    n.includes('hardware') ||
    n.includes('audio')
  ) {
    return 'tech'
  }
  if (
    n.includes('accesorio') ||
    n.includes('bolso') ||
    n.includes('maletin') ||
    n.includes('gorra') ||
    n.includes('termo')
  ) {
    return 'accessories'
  }
  return 'general'
}

/**
 * Serializes category-specific attributes and sizes into a clean suffix inside description
 * Example: "Camiseta oficial en algodón [Tallas: S, M, L, XL | Material: Algodón 100% | Color: Rojo UV]"
 */
export function buildProductDescription(
  baseDescription: string,
  options: {
    sizes?: string[]
    attributes?: Record<string, string>
  },
): string {
  const cleanBase = stripMetadataBlock(baseDescription).trim()
  const parts: string[] = []

  if (options.sizes && options.sizes.length > 0) {
    parts.push(`Tallas: ${options.sizes.join(', ')}`)
  }

  if (options.attributes) {
    for (const [key, val] of Object.entries(options.attributes)) {
      const trimmedVal = val?.trim()
      if (trimmedVal) {
        parts.push(`${key}: ${trimmedVal}`)
      }
    }
  }

  if (parts.length === 0) {
    return cleanBase
  }

  const metaBlock = `[${parts.join(' | ')}]`
  return cleanBase ? `${cleanBase} ${metaBlock}` : metaBlock
}

function stripMetadataBlock(description: string): string {
  return description.replace(/\s*\[(?:Tallas|Material|Color|Autor|Editorial|Marca|Garantía|Estado|Medida|Especificación)[^\]]*\]\s*$/i, '')
}

export function parseProductMetadata(
  description: string,
  categoryName: string,
): ParsedProductMetadata {
  const raw = description || ''
  const match = raw.match(/\[([^\]]+)\]\s*$/)
  const rawAttributes: Record<string, string> = {}
  const specs: { label: string; value: string }[] = []
  let sizes: string[] = []

  let cleanDescription = raw.trim()

  if (match) {
    const inside = match[1]
    const segments = inside.split('|').map((s) => s.trim())
    let hasValidPair = false

    for (const seg of segments) {
      const colonIdx = seg.indexOf(':')
      if (colonIdx > 0) {
        hasValidPair = true
        const key = seg.slice(0, colonIdx).trim()
        const val = seg.slice(colonIdx + 1).trim()
        if (normalize(key) === 'tallas' || normalize(key) === 'talla') {
          sizes = val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        } else if (val) {
          rawAttributes[key] = val
          specs.push({ label: key, value: val })
        }
      }
    }

    if (hasValidPair) {
      cleanDescription = raw.slice(0, match.index).trim()
    }
  }

  const template = detectCategoryTemplate(categoryName)
  if (template === 'clothing') {
    if (sizes.length === 0) {
      sizes = ['S', 'M', 'L', 'XL']
    }
  } else if (template === 'accessories') {
    sizes = sizes.filter((s) => !CLOTHING_SIZES.includes(s.toUpperCase()))
  } else {
    sizes = []
  }

  return {
    cleanDescription: cleanDescription || 'Producto institucional disponible en Tienda Univalle.',
    sizes,
    specs,
    rawAttributes,
  }
}
