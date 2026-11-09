import { InvalidCartError } from './cart-item.entity.js';
import { CartEntity } from './cart.entity.js';

describe('CartEntity', () => {
  it('calculates exact summary matching Univalle Shop reference (5 items, $239.000 subtotal, $8.000 shipping, $45.410 taxes, $292.410 total)', () => {
    let cart = CartEntity.createEmpty('estudiante-1');

    cart = cart
      .addItem({
        productId: 'prod-camiseta',
        name: 'Camiseta Oficial Univalle',
        category: 'ROPA',
        description: 'Colección 2026 · Talla: M',
        price: 45000,
        quantity: 1,
      })
      .addItem({
        productId: 'prod-agenda',
        name: 'Agenda Académica 2026',
        category: 'ACADÉMICO',
        description: 'Material · Talla: Única',
        price: 28000,
        quantity: 2,
      })
      .addItem({
        productId: 'prod-taza',
        name: 'Taza Univalle 75 Años',
        category: 'ACCESORIOS',
        description: 'Aniversario · Talla: Única',
        price: 18000,
        quantity: 1,
      })
      .addItem({
        productId: 'prod-maletin',
        name: 'Maletín Universitario',
        category: 'BOLSOS',
        description: 'Colección 2026 · Talla: Única',
        price: 120000,
        quantity: 1,
      });

    const summary = cart.getSummary();

    expect(summary.distinctItemsCount).toBe(4);
    expect(summary.totalItems).toBe(5);
    expect(summary.subtotal).toBe(239000);
    expect(summary.estimatedShipping).toBe(8000);
    expect(summary.taxes).toBe(45410);
    expect(summary.totalFinal).toBe(292410);
  });

  it('applies valid promo code and recalculates taxes and total', () => {
    const cart = CartEntity.createEmpty('estudiante-1')
      .addItem({
        productId: 'prod-1',
        name: 'Buzo Univalle',
        category: 'ROPA',
        price: 100000,
        quantity: 1,
      })
      .applyPromoCode('UNIVALLE10');

    const summary = cart.getSummary();
    expect(summary.discountAmount).toBe(10000);
    expect(summary.taxes).toBe(17100); // 19% de 90.000
    expect(summary.totalFinal).toBe(90000 + 8000 + 17100);
  });

  it('rejects invalid promo codes', () => {
    const cart = CartEntity.createEmpty('estudiante-1');
    expect(() => cart.applyPromoCode('INVALIDO99')).toThrow(InvalidCartError);
  });

  it('keeps a buyer cart and shipping amount separate for each store', () => {
    const firstStoreCart = CartEntity.createEmpty('buyer-1', 'store-1', 3000)
      .addItem({
        productId: 'store-1-product',
        name: 'Producto 1',
        category: 'General',
        price: 10000,
      });
    const secondStoreCart = CartEntity.createEmpty('buyer-1', 'store-2', 7000)
      .addItem({
        productId: 'store-2-product',
        name: 'Producto 2',
        category: 'General',
        price: 20000,
      });

    expect(firstStoreCart.toJSON().storeProfileId).toBe('store-1');
    expect(firstStoreCart.getSummary().estimatedShipping).toBe(3000);
    expect(secondStoreCart.toJSON().storeProfileId).toBe('store-2');
    expect(secondStoreCart.getSummary().estimatedShipping).toBe(7000);
  });
});
