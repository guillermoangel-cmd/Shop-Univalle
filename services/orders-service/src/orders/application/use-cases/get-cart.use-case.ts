import { CartEntity } from '../../domain/entities/cart.entity.js';
import type { CartRepository } from '../../domain/ports/cart.repository.js';

export class GetCartUseCase {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(userId: string): Promise<CartEntity> {
    const existing = await this.cartRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }
    const empty = CartEntity.createEmpty(userId);
    return this.cartRepository.save(empty);
  }
}

