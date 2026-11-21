export const DEFAULT_PRODUCT_IMAGE = '/assets/default_products/producto_default.webp'

export interface Product {
  id: string
  name: string
  description: string
  imageUrl: string
  category: string
  categoryId?: string | null
  price: number
  stock: number
  profileId?: string | null
  active?: boolean
  shopName?: string
  shippingCost?: number
}