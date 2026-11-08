import { CheckoutOrderUseCase } from './checkout-order.use-case.js';
import { CartEntity } from '../../domain/entities/cart.entity.js';
import type { OrderEntity } from '../../domain/entities/order.entity.js';
import type { CartRepository } from '../../domain/ports/cart.repository.js';
import type { OrderRepository } from '../../domain/ports/order.repository.js';

describe('CheckoutOrderUseCase', () => {
  it('creates an order from selected cart items and clears them from the cart', async () => {
    let storedCart = CartEntity.createEmpty('user-1')
      .addItem({
        productId: 'p1',
        name: 'Camiseta Oficial Univalle',
        category: 'ROPA',
        price: 45000,
        quantity: 2,
        selected: true,
      })
      .addItem({
        productId: 'p2',
        name: 'Taza Univalle 75 Años',
        category: 'ACCESORIOS',
        price: 18000,
        quantity: 1,
        selected: false,
      });

    const cartRepo: CartRepository = {
      findByUserId: async () => storedCart,
      save: async (cart) => {
        storedCart = cart;
        return cart;
      },
    };

    const savedOrders: OrderEntity[] = [];
    const orderRepo: OrderRepository = {
      save: async (order) => {
        savedOrders.push(order);
        return order;
      },
      findByUserId: async () => savedOrders,
      findById: async () => null,
    };

    const useCase = new CheckoutOrderUseCase(cartRepo, orderRepo);
    const result = await useCase.execute('user-1', 'AUTHENTICATED');

    expect(result.order.totalItems).toBe(2);
    expect(result.order.subtotal).toBe(90000);
    expect(result.order.status).toBe('PENDING_PAYMENT');
    expect(result.cart.items).toHaveLength(1);
    expect(result.cart.items[0].productId).toBe('p2');
  });
});

