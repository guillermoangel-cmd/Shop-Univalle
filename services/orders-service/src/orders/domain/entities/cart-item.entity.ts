export interface CartItemData {
  productId: string;
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
  price: number;
  quantity?: number;
  selected?: boolean;
  favorite?: boolean;
}

export class InvalidCartError extends Error {}

export class CartItemEntity {
  constructor(
    public readonly productId: string,
    public readonly name: string,
    public readonly category: string,
    public readonly description: string,
    public readonly imageUrl: string,
    public readonly price: number,
    public readonly quantity: number,
    public readonly selected: boolean,
    public readonly favorite: boolean,
  ) {}

  static create(data: CartItemData): CartItemEntity {
    if (
      typeof data?.productId !== 'string' ||
      !data.productId.trim() ||
      typeof data?.name !== 'string' ||
      !data.name.trim() ||
      typeof data?.category !== 'string' ||
      !data.category.trim()
    ) {
      throw new InvalidCartError(
        'ProductId, name and category are required for a cart item',
      );
    }

    if (!Number.isFinite(data.price) || data.price <= 0) {
      throw new InvalidCartError('Price must be greater than zero');
    }

    const quantity = data.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new InvalidCartError('Quantity must be a positive integer');
    }

    return new CartItemEntity(
      data.productId.trim(),
      data.name.trim(),
      data.category.trim(),
      typeof data.description === 'string' && data.description.trim()
        ? data.description.trim()
        : 'Colección 2026 · Talla: Única',
      typeof data.imageUrl === 'string' ? data.imageUrl.trim() : '',
      data.price,
      quantity,
      data.selected ?? true,
      data.favorite ?? false,
    );
  }

  getLineTotal(): number {
    return this.price * this.quantity;
  }

  withChanges(patch: {
    quantity?: number;
    selected?: boolean;
    favorite?: boolean;
  }): CartItemEntity {
    const nextQuantity = patch.quantity ?? this.quantity;
    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
      throw new InvalidCartError('Quantity must be a positive integer');
    }

    return new CartItemEntity(
      this.productId,
      this.name,
      this.category,
      this.description,
      this.imageUrl,
      this.price,
      nextQuantity,
      patch.selected ?? this.selected,
      patch.favorite ?? this.favorite,
    );
  }
}

