import { CartEntity } from '../../domain/entities/cart.entity.js';
import type { CartRepository } from '../../domain/ports/cart.repository.js';

export class GetCartUseCase {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(
    userId: string,
    storeProfileId = 'default-store',
    shippingCost = 8000,
  ): Promise<CartEntity> {
    const existing = await this.cartRepository.findByUserId(userId, storeProfileId);
    if (existing) {
      const current = existing.withShippingCost(shippingCost);
      return current.shippingCost === existing.shippingCost
        ? existing
        : this.cartRepository.save(current);
    }
    const empty = CartEntity.createEmpty(userId, storeProfileId, shippingCost);
    return this.cartRepository.save(empty);
  }
}
