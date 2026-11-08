import { CartEntity } from '../../domain/entities/cart.entity.js';
import type { CartRepository } from '../../domain/ports/cart.repository.js';

export class ClearCartUseCase {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(userId: string): Promise<CartEntity> {
    const current =
      (await this.cartRepository.findByUserId(userId)) ??
      CartEntity.createEmpty(userId);
    const cleared = current.clear();
    return this.cartRepository.save(cleared);
  }
}

