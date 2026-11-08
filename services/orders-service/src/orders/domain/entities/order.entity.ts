import {
  CartItemEntity,
  InvalidCartError,
} from './cart-item.entity.js';
import type { CartEntity } from './cart.entity.js';

export type CheckoutMode = 'AUTHENTICATED' | 'GUEST';
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED';

export class OrderEntity {
  constructor(
    public readonly id: string | null,
    public readonly orderNumber: string,
    public readonly userId: string,
    public readonly checkoutMode: CheckoutMode,
    public readonly items: CartItemEntity[],
    public readonly totalItems: number,
    public readonly subtotal: number,
    public readonly discountAmount: number,
    public readonly estimatedShipping: number,
    public readonly taxes: number,
    public readonly totalFinal: number,
    public readonly promoCode: string | null,
    public readonly status: OrderStatus,
    public readonly createdAt: Date,
  ) {}

  static createFromCart(
    cart: CartEntity,
    checkoutMode: CheckoutMode = 'AUTHENTICATED',
  ): OrderEntity {
    const selectedItems = cart.items.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      throw new InvalidCartError(
        'Debes seleccionar al menos un producto para procesar el pedido',
      );
    }

    const summary = cart.getSummary();
    const orderNumber = `UV-${Date.now().toString(36).toUpperCase()}`;

    return new OrderEntity(
      null,
      orderNumber,
      cart.userId,
      checkoutMode,
      selectedItems,
      summary.totalItems,
      summary.subtotal,
      summary.discountAmount,
      summary.estimatedShipping,
      summary.taxes,
      summary.totalFinal,
      summary.promoCode,
      'PENDING_PAYMENT',
      new Date(),
    );
  }
}

