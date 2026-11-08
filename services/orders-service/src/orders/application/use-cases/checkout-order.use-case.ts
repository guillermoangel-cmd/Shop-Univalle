import { CartEntity } from '../../domain/entities/cart.entity.js';
import {
  OrderEntity,
  type CheckoutMode,
} from '../../domain/entities/order.entity.js';
import type { CartRepository } from '../../domain/ports/cart.repository.js';
import type { OrderRepository } from '../../domain/ports/order.repository.js';

export class CheckoutOrderUseCase {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(
    userId: string,
    checkoutMode: CheckoutMode = 'AUTHENTICATED',
  ): Promise<{ order: OrderEntity; cart: CartEntity }> {
    const currentCart =
      (await this.cartRepository.findByUserId(userId)) ??
      CartEntity.createEmpty(userId);

    const newOrder = OrderEntity.createFromCart(currentCart, checkoutMode);
    const savedOrder = await this.orderRepository.save(newOrder);

    // Mantener en el carrito únicamente los ítems que no estaban seleccionados
    const remainingItems = currentCart.items.filter((item) => !item.selected);
    const nextCart = new CartEntity(
      currentCart.id,
      currentCart.userId,
      remainingItems,
      null,
      0,
    );
    const savedCart = await this.cartRepository.save(nextCart);

    return { order: savedOrder, cart: savedCart };
  }
}

