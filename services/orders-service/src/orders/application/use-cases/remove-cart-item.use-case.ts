import { CartEntity } from '../../domain/entities/cart.entity.js';
import type { CartRepository } from '../../domain/ports/cart.repository.js';

export class RemoveCartItemUseCase {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(userId: string, productId: string): Promise<CartEntity> {
    const current =
      (await this.cartRepository.findByUserId(userId)) ??
      CartEntity.createEmpty(userId);
    const updated = current.removeItem(productId);
    return this.cartRepository.save(updated);
  }
}

