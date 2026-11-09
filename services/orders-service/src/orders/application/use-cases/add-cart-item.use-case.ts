import type { CartItemData } from '../../domain/entities/cart-item.entity.js';
import { CartEntity } from '../../domain/entities/cart.entity.js';
import type { CartRepository } from '../../domain/ports/cart.repository.js';

export class AddCartItemUseCase {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(
    userId: string,
    itemData: CartItemData,
    storeProfileId = 'default-store',
    shippingCost = 8000,
  ): Promise<CartEntity> {
    const current =
      (await this.cartRepository.findByUserId(userId, storeProfileId)) ??
      CartEntity.createEmpty(userId, storeProfileId, shippingCost);
    const updated = current.withShippingCost(shippingCost).addItem(itemData);
    return this.cartRepository.save(updated);
  }
}
