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
    storeProfileId = 'default-store',
    deliveryAddress = '',
    shippingCost = 8000,
  ): Promise<{ order: OrderEntity; cart: CartEntity }> {
    const storedCart =
      (await this.cartRepository.findByUserId(userId, storeProfileId)) ??
      CartEntity.createEmpty(userId, storeProfileId, shippingCost);
    const currentCart = storedCart.withShippingCost(shippingCost);

    const newOrder = OrderEntity.createFromCart(
      currentCart,
      checkoutMode,
      deliveryAddress,
    );
    const savedOrder = await this.orderRepository.save(newOrder);

    // Mantener en el carrito únicamente los ítems que no estaban seleccionados
    const remainingItems = currentCart.items.filter((item) => !item.selected);
    const nextCart = new CartEntity(
      currentCart.id,
      currentCart.userId,
      remainingItems,
      null,
      0,
      currentCart.storeProfileId,
      currentCart.shippingCost,
    );
    const savedCart = await this.cartRepository.save(nextCart);

    return { order: savedOrder, cart: savedCart };
  }
}
