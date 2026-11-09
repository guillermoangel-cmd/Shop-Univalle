import { CartEntity } from '../../domain/entities/cart.entity.js';
import type { CartRepository } from '../../domain/ports/cart.repository.js';

export class ClearCartUseCase {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(
    userId: string,
    storeProfileId = 'default-store',
    shippingCost = 8000,
  ): Promise<CartEntity> {
    const current =
      (await this.cartRepository.findByUserId(userId, storeProfileId)) ??
      CartEntity.createEmpty(userId, storeProfileId, shippingCost);
    const cleared = current.withShippingCost(shippingCost).clear();
    return this.cartRepository.save(cleared);
  }
}
