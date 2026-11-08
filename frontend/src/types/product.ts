export interface Product {
  id: string
  name: string
  description: string
  imageUrl: string
  category: string
  categoryId?: string | null
  price: number
  stock: number
}