import type { CartState, OrderReceipt } from '../types/cart'
import type { Product } from '../types/product'

const DEFAULT_SHIPPING_COST = 8000

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

async function requestJson<T>(
  path: string,
  accessToken: string,
  fallbackMessage: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(path, { ...init, headers })
  const result = await response.json().catch(() => null) as
    | { message?: string | string[] }
    | T
    | null
  if (!response.ok) {
    const message =
      result && typeof result === 'object' && 'message' in result
        ? result.message
        : undefined
    throw new Error(
      Array.isArray(message)
        ? message.join(' ')
        : message || fallbackMessage,
    )
  }
  if (result === null) throw new Error('El servicio respondió sin datos.')
  return result as T
}

function jsonBody(value: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  }
}

function cartQuery(userId: string, storeProfileId: string, shippingCost: number) {
  const params = new URLSearchParams({
    userId,
    storeProfileId,
    shippingCost: String(shippingCost),
  })
  return params.toString()
}

export function fetchCart(
  userId: string,
  storeProfileId: string,
  shippingCost: number,
  accessToken: string,
): Promise<CartState> {
  return requestJson(
    `/api/cart?${cartQuery(userId, storeProfileId, shippingCost)}`,
    accessToken,
    'No se pudo cargar el carrito.',
  )
}

export function addProductToCart(
  userId: string,
  product: Product,
  quantity: number,
  accessToken: string,
): Promise<CartState> {
  const storeProfileId = product.profileId || ''
  return requestJson(
    '/api/cart/items',
    accessToken,
    'No se pudo agregar el producto.',
    jsonBody({
      userId,
      storeProfileId,
      shippingCost: product.shippingCost ?? DEFAULT_SHIPPING_COST,
      item: {
        productId: product.id,
        name: product.name,
        category: product.category,
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        price: product.price,
        quantity,
      },
    }),
  )
}

export function updateCartItemState(
  userId: string,
  productId: string,
  patch: { quantity?: number; selected?: boolean; favorite?: boolean },
  storeProfileId: string,
  shippingCost: number,
  accessToken: string,
): Promise<CartState> {
  return requestJson(
    `/api/cart/items/${encodeURIComponent(productId)}`,
    accessToken,
    'No se pudo actualizar el carrito.',
    {
      ...jsonBody({ userId, storeProfileId, shippingCost, ...patch }),
      method: 'PATCH',
    },
  )
}

export function removeCartItem(
  userId: string,
  productId: string,
  storeProfileId: string,
  shippingCost: number,
  accessToken: string,
): Promise<CartState> {
  return requestJson(
    `/api/cart/items/${encodeURIComponent(productId)}?${cartQuery(userId, storeProfileId, shippingCost)}`,
    accessToken,
    'No se pudo eliminar el producto.',
    { method: 'DELETE' },
  )
}

export function clearAllCart(
  userId: string,
  storeProfileId: string,
  shippingCost: number,
  accessToken: string,
): Promise<CartState> {
  return requestJson(
    `/api/cart?${cartQuery(userId, storeProfileId, shippingCost)}`,
    accessToken,
    'No se pudo vaciar el carrito.',
    { method: 'DELETE' },
  )
}

export function applyCartPromoCode(
  userId: string,
  promoCode: string,
  storeProfileId: string,
  shippingCost: number,
  accessToken: string,
): Promise<CartState> {
  return requestJson(
    '/api/cart/promo',
    accessToken,
    'No se pudo aplicar el código promocional.',
    jsonBody({ userId, promoCode, storeProfileId, shippingCost }),
  )
}

export async function checkoutCartOrder(
  userId: string,
  checkoutMode: 'AUTHENTICATED' | 'GUEST',
  storeProfileId: string,
  shippingCost: number,
  deliveryAddress: string,
  accessToken: string,
): Promise<{ order: OrderReceipt; cart: CartState }> {
  return requestJson(
    '/api/orders/checkout',
    accessToken,
    'No se pudo procesar el pedido.',
    jsonBody({
      userId,
      checkoutMode,
      storeProfileId,
      shippingCost,
      deliveryAddress,
    }),
  )
}
