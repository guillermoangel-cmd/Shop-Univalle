export interface CartItem {
  productId: string
  name: string
  category: string
  description: string
  imageUrl: string
  price: number
  quantity: number
  lineTotal: number
  selected: boolean
  favorite: boolean
}

export interface CartSummary {
  distinctItemsCount: number
  totalItems: number
  subtotal: number
  discountAmount: number
  estimatedShipping: number
  taxRate: number
  taxes: number
  totalFinal: number
  promoCode: string | null
}

export interface CartState {
  id: string | null
  userId: string
  storeProfileId?: string
  items: CartItem[]
  summary: CartSummary
}

export interface OrderReceipt {
  id: string | null
  orderNumber: string
  userId: string
  storeProfileId: string
  deliveryAddress: string
  checkoutMode: 'AUTHENTICATED' | 'GUEST'
  items: CartItem[]
  totalItems: number
  subtotal: number
  discountAmount: number
  estimatedShipping: number
  taxes: number
  totalFinal: number
  promoCode: string | null
  status: 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED'
  createdAt: string
}
