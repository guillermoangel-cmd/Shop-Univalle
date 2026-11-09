import { CartEntity } from '../../domain/entities/cart.entity.js';
import type { CartRepository } from '../../domain/ports/cart.repository.js';

export interface UpdateCartItemInput {
  quantity?: number;
  selected?: boolean;
  favorite?: boolean;
}

export class UpdateCartItemUseCase {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(
    userId: string,
    productId: string,
    patch: UpdateCartItemInput,
    storeProfileId = 'default-store',
    shippingCost = 8000,
  ): Promise<CartEntity> {
    const current =
      (await this.cartRepository.findByUserId(userId, storeProfileId)) ??
      CartEntity.createEmpty(userId, storeProfileId, shippingCost);
    const updated = current.withShippingCost(shippingCost).updateItem(productId, patch);
    return this.cartRepository.save(updated);
  }
}
