import type { OrderEntity } from '../../domain/entities/order.entity.js';
import type { OrderRepository } from '../../domain/ports/order.repository.js';

export class ListOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(userId: string): Promise<OrderEntity[]> {
    return this.orderRepository.findByUserId(userId);
  }
}

