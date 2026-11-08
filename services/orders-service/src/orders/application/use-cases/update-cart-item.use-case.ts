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
  ): Promise<CartEntity> {
    const current =
      (await this.cartRepository.findByUserId(userId)) ??
      CartEntity.createEmpty(userId);
    const updated = current.updateItem(productId, patch);
    return this.cartRepository.save(updated);
  }
}

