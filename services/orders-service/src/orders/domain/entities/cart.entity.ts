import {
  CartItemEntity,
  InvalidCartError,
  type CartItemData,
} from './cart-item.entity.js';

export interface CartSummary {
  distinctItemsCount: number;
  totalItems: number;
  subtotal: number;
  discountAmount: number;
  estimatedShipping: number;
  taxRate: number;
  taxes: number;
  totalFinal: number;
  promoCode: string | null;
}

const VALID_PROMO_CODES: Record<string, number> = {
  UNIVALLE10: 0.1,
  UNIVALLE20: 0.2,
  UV75: 0.15,
};

export class CartEntity {
  public static readonly DEFAULT_SHIPPING_COST = 8000;
  public static readonly TAX_RATE = 0.19;

  constructor(
    public readonly id: string | null,
    public readonly userId: string,
    public readonly items: CartItemEntity[],
    public readonly promoCode: string | null = null,
    public readonly discountRate: number = 0,
    public readonly storeProfileId: string = 'default-store',
    public readonly shippingCost: number = 8000,
  ) {}

  static createEmpty(
    userId: string,
    storeProfileId = 'default-store',
    shippingCost = 8000,
  ): CartEntity {
    if (typeof userId !== 'string' || !userId.trim()) {
      throw new InvalidCartError('UserId is required');
    }
    if (!storeProfileId.trim() || !Number.isSafeInteger(shippingCost) || shippingCost < 0) {
      throw new InvalidCartError('Store and shipping cost are required');
    }
    return new CartEntity(null, userId.trim(), [], null, 0, storeProfileId, shippingCost);
  }

  addItem(data: CartItemData): CartEntity {
    const incoming = CartItemEntity.create(data);
    const existingIndex = this.items.findIndex(
      (item) => item.productId === incoming.productId,
    );

    if (existingIndex === -1) {
      return new CartEntity(
        this.id,
        this.userId,
        [...this.items, incoming],
        this.promoCode,
        this.discountRate,
        this.storeProfileId,
        this.shippingCost,
      );
    }

    const updatedItems = this.items.map((item, idx) =>
      idx === existingIndex
        ? item.withChanges({
            quantity: item.quantity + incoming.quantity,
            selected: true,
          })
        : item,
    );

    return new CartEntity(
      this.id,
      this.userId,
      updatedItems,
      this.promoCode,
      this.discountRate,
      this.storeProfileId,
      this.shippingCost,
    );
  }

  updateItem(
    productId: string,
    patch: { quantity?: number; selected?: boolean; favorite?: boolean },
  ): CartEntity {
    const exists = this.items.some((item) => item.productId === productId);
    if (!exists) {
      throw new InvalidCartError('Item not found in cart');
    }

    const updatedItems = this.items.map((item) =>
      item.productId === productId ? item.withChanges(patch) : item,
    );

    return new CartEntity(
      this.id,
      this.userId,
      updatedItems,
      this.promoCode,
      this.discountRate,
      this.storeProfileId,
      this.shippingCost,
    );
  }

  removeItem(productId: string): CartEntity {
    const filtered = this.items.filter((item) => item.productId !== productId);
    return new CartEntity(
      this.id,
      this.userId,
      filtered,
      filtered.length > 0 ? this.promoCode : null,
      filtered.length > 0 ? this.discountRate : 0,
      this.storeProfileId,
      this.shippingCost,
    );
  }

  clear(): CartEntity {
    return new CartEntity(
      this.id,
      this.userId,
      [],
      null,
      0,
      this.storeProfileId,
      this.shippingCost,
    );
  }

  withShippingCost(shippingCost: number): CartEntity {
    if (!Number.isSafeInteger(shippingCost) || shippingCost < 0) {
      throw new InvalidCartError('Shipping cost must be a non-negative integer');
    }
    return new CartEntity(
      this.id,
      this.userId,
      this.items,
      this.promoCode,
      this.discountRate,
      this.storeProfileId,
      shippingCost,
    );
  }

  applyPromoCode(rawCode: string): CartEntity {
    const normalized = rawCode.trim().toUpperCase();
    if (!normalized) {
      return new CartEntity(
        this.id,
        this.userId,
        this.items,
        null,
        0,
        this.storeProfileId,
        this.shippingCost,
      );
    }

    const rate = VALID_PROMO_CODES[normalized];
    if (rate === undefined) {
      throw new InvalidCartError(
        'Código promocional no válido. Prueba con UNIVALLE10 o UV75.',
      );
    }

    return new CartEntity(
      this.id,
      this.userId,
      this.items,
      normalized,
      rate,
      this.storeProfileId,
      this.shippingCost,
    );
  }

  getSummary(): CartSummary {
    const selectedItems = this.items.filter((item) => item.selected);
    const totalItems = selectedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const subtotal = selectedItems.reduce(
      (sum, item) => sum + item.getLineTotal(),
      0,
    );
    const discountAmount = Math.round(subtotal * this.discountRate);
    const netSubtotal = Math.max(0, subtotal - discountAmount);
    const estimatedShipping =
      totalItems > 0 ? this.shippingCost : 0;
    const taxes = Math.round(netSubtotal * CartEntity.TAX_RATE);
    const totalFinal = netSubtotal + estimatedShipping + taxes;

    return {
      distinctItemsCount: this.items.length,
      totalItems,
      subtotal,
      discountAmount,
      estimatedShipping,
      taxRate: CartEntity.TAX_RATE,
      taxes,
      totalFinal,
      promoCode: this.promoCode,
    };
  }

  toJSON() {
    const summary = this.getSummary();
    return {
      id: this.id,
      userId: this.userId,
      storeProfileId: this.storeProfileId,
      items: this.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        category: item.category,
        description: item.description,
        imageUrl: item.imageUrl,
        price: item.price,
        quantity: item.quantity,
        lineTotal: item.getLineTotal(),
        selected: item.selected,
        favorite: item.favorite,
      })),
      summary,
    };
  }
}
