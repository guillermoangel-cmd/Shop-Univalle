import type { CartEntity } from '../entities/cart.entity.js';

export const CART_REPOSITORY = Symbol('CART_REPOSITORY');

export interface CartRepository {
  findByUserId(userId: string): Promise<CartEntity | null>;
  save(cart: CartEntity): Promise<CartEntity>;
}

