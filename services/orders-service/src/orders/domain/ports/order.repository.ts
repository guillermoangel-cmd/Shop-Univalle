import type { OrderEntity } from '../entities/order.entity.js';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderRepository {
  save(order: OrderEntity): Promise<OrderEntity>;
  findByUserId(userId: string): Promise<OrderEntity[]>;
  findById(id: string): Promise<OrderEntity | null>;
}

