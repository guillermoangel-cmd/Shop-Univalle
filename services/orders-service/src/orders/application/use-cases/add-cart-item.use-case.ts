import type { CartItemData } from '../../domain/entities/cart-item.entity.js';
import { CartEntity } from '../../domain/entities/cart.entity.js';
import type { CartRepository } from '../../domain/ports/cart.repository.js';

export class AddCartItemUseCase {
  constructor(private readonly cartRepository: CartRepository) {}

  async execute(userId: string, itemData: CartItemData): Promise<CartEntity> {
    const current =
      (await this.cartRepository.findByUserId(userId)) ??
      CartEntity.createEmpty(userId);
    const updated = current.addItem(itemData);
    return this.cartRepository.save(updated);
  }
}

