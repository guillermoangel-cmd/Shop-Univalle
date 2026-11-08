import type { CartItem, CartState, CartSummary, OrderReceipt } from '../types/cart'
import type { Product } from '../types/product'

const STORAGE_KEY = 'univalle_shop_cart_v1'
const ORDERS_STORAGE_KEY = 'univalle_shop_orders_v1'
const SHIPPING_COST = 8000
const TAX_RATE = 0.19

const PROMO_CODES: Record<string, number> = {
  UNIVALLE10: 0.1,
  UNIVALLE20: 0.2,
  UV75: 0.15,
}

export const DEFAULT_UNIVALLE_PRODUCTS: Product[] = [
  {
    id: 'uv-camiseta-2026',
    name: 'Camiseta Oficial Univalle',
    category: 'ROPA',
    description: 'Colección 2026 · Talla: M',
    imageUrl: '',
    price: 45000,
    stock: 25,
  },
  {
    id: 'uv-agenda-2026',
    name: 'Agenda Académica 2026',
    category: 'ACADÉMICO',
    description: 'Material · Talla: Única',
    imageUrl: '',
    price: 28000,
    stock: 40,
  },
  {
    id: 'uv-taza-75',
    name: 'Taza Univalle 75 Años',
    category: 'ACCESORIOS',
    description: 'Aniversario · Talla: Única',
    imageUrl: '',
    price: 18000,
    stock: 30,
  },
  {
    id: 'uv-maletin-2026',
    name: 'Maletín Universitario',
    category: 'BOLSOS',
    description: 'Colección 2026 · Talla: Única',
    imageUrl: '',
    price: 120000,
    stock: 15,
  },
]

function computeSummary(
  items: CartItem[],
  promoCode: string | null = null,
): CartSummary {
  const selected = items.filter((item) => item.selected)
  const totalItems = selected.reduce((acc, item) => acc + item.quantity, 0)
  const subtotal = selected.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  )
  const rate = promoCode ? (PROMO_CODES[promoCode] ?? 0) : 0
  const discountAmount = Math.round(subtotal * rate)
  const netSubtotal = Math.max(0, subtotal - discountAmount)
  const estimatedShipping = totalItems > 0 ? SHIPPING_COST : 0
  const taxes = Math.round(netSubtotal * TAX_RATE)
  const totalFinal = netSubtotal + estimatedShipping + taxes

  return {
    distinctItemsCount: items.length,
    totalItems,
    subtotal,
    discountAmount,
    estimatedShipping,
    taxRate: TAX_RATE,
    taxes,
    totalFinal,
    promoCode,
  }
}

function readLocalCart(userId: string): CartState {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
    if (raw) {
      const parsed = JSON.parse(raw) as CartState
      const items = (parsed.items ?? []).map((item) => ({
        ...item,
        lineTotal: item.price * item.quantity,
      }))
      return {
        id: parsed.id ?? 'local-cart',
        userId,
        items,
        summary: computeSummary(items, parsed.summary?.promoCode ?? null),
      }
    }
  } catch {
    // fallback to default
  }

  return {
    id: 'local-cart',
    userId,
    items: [],
    summary: computeSummary([], null),
  }
}

function writeLocalCart(userId: string, cart: CartState): CartState {
  const normalizedItems = cart.items.map((item) => ({
    ...item,
    lineTotal: item.price * item.quantity,
  }))
  const next: CartState = {
    ...cart,
    userId,
    items: normalizedItems,
    summary: computeSummary(normalizedItems, cart.summary?.promoCode ?? null),
  }
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(next))
  } catch {
    // ignore storage errors
  }
  return next
}

export async function fetchCart(userId = 'default-user'): Promise<CartState> {
  try {
    const response = await fetch(
      `/api/cart?userId=${encodeURIComponent(userId)}`,
    )
    if (response.ok) {
      const data = (await response.json()) as CartState
      return writeLocalCart(userId, data)
    }
  } catch {
    // Fallback local cuando orders-service no está levantado aún
  }
  return readLocalCart(userId)
}

export async function addProductToCart(
  userId: string,
  product: Product,
  quantity = 1,
): Promise<CartState> {
  const itemPayload = {
    productId: product.id,
    name: product.name,
    category: product.category,
    description: product.description || 'Colección 2026 · Talla: Única',
    imageUrl: product.imageUrl || '',
    price: product.price,
    quantity,
  }

  try {
    const response = await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, item: itemPayload }),
    })
    if (response.ok) {
      const data = (await response.json()) as CartState
      return writeLocalCart(userId, data)
    }
  } catch {
    // Fallback local
  }

  const current = readLocalCart(userId)
  const existingIndex = current.items.findIndex(
    (item) => item.productId === product.id,
  )
  let nextItems: CartItem[]
  if (existingIndex === -1) {
    nextItems = [
      ...current.items,
      {
        ...itemPayload,
        lineTotal: product.price * quantity,
        selected: true,
        favorite: false,
      },
    ]
  } else {
    nextItems = current.items.map((item, idx) =>
      idx === existingIndex
        ? {
            ...item,
            quantity: item.quantity + quantity,
            lineTotal: item.price * (item.quantity + quantity),
            selected: true,
          }
        : item,
    )
  }

  return writeLocalCart(userId, { ...current, items: nextItems })
}

export async function updateCartItemState(
  userId: string,
  productId: string,
  patch: { quantity?: number; selected?: boolean; favorite?: boolean },
): Promise<CartState> {
  try {
    const response = await fetch(
      `/api/cart/items/${encodeURIComponent(productId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...patch }),
      },
    )
    if (response.ok) {
      const data = (await response.json()) as CartState
      return writeLocalCart(userId, data)
    }
  } catch {
    // Fallback local
  }

  const current = readLocalCart(userId)
  const nextItems = current.items.map((item) => {
    if (item.productId !== productId) return item
    const nextQty = patch.quantity ?? item.quantity
    return {
      ...item,
      quantity: nextQty,
      lineTotal: item.price * nextQty,
      selected: patch.selected ?? item.selected,
      favorite: patch.favorite ?? item.favorite,
    }
  })

  return writeLocalCart(userId, { ...current, items: nextItems })
}

export async function removeCartItem(
  userId: string,
  productId: string,
): Promise<CartState> {
  try {
    const response = await fetch(
      `/api/cart/items/${encodeURIComponent(productId)}?userId=${encodeURIComponent(userId)}`,
      { method: 'DELETE' },
    )
    if (response.ok) {
      const data = (await response.json()) as CartState
      return writeLocalCart(userId, data)
    }
  } catch {
    // Fallback local
  }

  const current = readLocalCart(userId)
  const nextItems = current.items.filter((item) => item.productId !== productId)
  return writeLocalCart(userId, { ...current, items: nextItems })
}

export async function clearAllCart(userId: string): Promise<CartState> {
  try {
    const response = await fetch(
      `/api/cart?userId=${encodeURIComponent(userId)}`,
      { method: 'DELETE' },
    )
    if (response.ok) {
      const data = (await response.json()) as CartState
      return writeLocalCart(userId, data)
    }
  } catch {
    // Fallback local
  }

  return writeLocalCart(userId, {
    id: 'local-cart',
    userId,
    items: [],
    summary: computeSummary([], null),
  })
}

export async function applyCartPromoCode(
  userId: string,
  promoCode: string,
): Promise<CartState> {
  const normalized = promoCode.trim().toUpperCase()
  try {
    const response = await fetch('/api/cart/promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, promoCode: normalized }),
    })
    if (response.ok) {
      const data = (await response.json()) as CartState
      return writeLocalCart(userId, data)
    }
    if (response.status === 400) {
      const errBody = (await response.json().catch(() => null)) as {
        message?: string
      } | null
      throw new Error(
        errBody?.message ||
          'Código promocional no válido. Prueba con UNIVALLE10 o UV75.',
      )
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Código promocional')) {
      throw error
    }
  }

  if (normalized && !(normalized in PROMO_CODES)) {
    throw new Error(
      'Código promocional no válido. Prueba con UNIVALLE10 o UV75.',
    )
  }

  const current = readLocalCart(userId)
  return writeLocalCart(userId, {
    ...current,
    summary: computeSummary(current.items, normalized || null),
  })
}

export async function checkoutCartOrder(
  userId: string,
  checkoutMode: 'AUTHENTICATED' | 'GUEST',
): Promise<{ order: OrderReceipt; cart: CartState }> {
  try {
    const response = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, checkoutMode }),
    })
    if (response.ok) {
      const data = (await response.json()) as {
        order: OrderReceipt
        cart: CartState
      }
      writeLocalCart(userId, data.cart)
      return data
    }
    if (response.status === 400) {
      const errBody = (await response.json().catch(() => null)) as {
        message?: string
      } | null
      throw new Error(
        errBody?.message || 'Selecciona al menos un producto para continuar.',
      )
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Selecciona')) {
      throw error
    }
  }

  const current = readLocalCart(userId)
  const selectedItems = current.items.filter((item) => item.selected)
  if (selectedItems.length === 0) {
    throw new Error(
      'Debes seleccionar al menos un producto para procesar el pedido.',
    )
  }

  const order: OrderReceipt = {
    id: `ord-${Date.now()}`,
    orderNumber: `UV-${Date.now().toString(36).toUpperCase()}`,
    userId,
    checkoutMode,
    items: selectedItems,
    totalItems: current.summary.totalItems,
    subtotal: current.summary.subtotal,
    discountAmount: current.summary.discountAmount,
    estimatedShipping: current.summary.estimatedShipping,
    taxes: current.summary.taxes,
    totalFinal: current.summary.totalFinal,
    promoCode: current.summary.promoCode,
    status: 'PENDING_PAYMENT',
    createdAt: new Date().toISOString(),
  }

  try {
    const existingRaw = localStorage.getItem(`${ORDERS_STORAGE_KEY}_${userId}`)
    const existingOrders = existingRaw
      ? (JSON.parse(existingRaw) as OrderReceipt[])
      : []
    localStorage.setItem(
      `${ORDERS_STORAGE_KEY}_${userId}`,
      JSON.stringify([order, ...existingOrders]),
    )
  } catch {
    // ignore
  }

  const remaining = current.items.filter((item) => !item.selected)
  const nextCart = writeLocalCart(userId, {
    ...current,
    items: remaining,
    summary: computeSummary(remaining, null),
  })

  return { order, cart: nextCart }
}

