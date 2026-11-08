import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { CartItemEntity } from '../../domain/entities/cart-item.entity.js';
import { CartEntity } from '../../domain/entities/cart.entity.js';
import type { CartRepository } from '../../domain/ports/cart.repository.js';
import { CartMongoDocument } from '../persistence/cart-mongo.schema.js';

@Injectable()
export class CartMongoRepositoryAdapter implements CartRepository {
  private readonly memoryCarts = new Map<string, CartEntity>();

  constructor(
    @InjectModel(CartMongoDocument.name)
    private readonly cartModel: Model<CartMongoDocument>,
  ) {}

  private isMongoConnected(): boolean {
    return Number(this.cartModel?.db?.readyState) === 1;
  }

  async findByUserId(userId: string): Promise<CartEntity | null> {
    if (!this.isMongoConnected()) {
      return this.memoryCarts.get(userId) ?? null;
    }

    try {
      const record = await this.cartModel.findOne({ userId }).exec();
      return record ? this.toEntity(record) : null;
    } catch {
      return this.memoryCarts.get(userId) ?? null;
    }
  }

  async save(cart: CartEntity): Promise<CartEntity> {
    if (!this.isMongoConnected()) {
      const saved = new CartEntity(
        cart.id ?? `mem-cart-${cart.userId}`,
        cart.userId,
        cart.items,
        cart.promoCode,
        cart.discountRate,
      );
      this.memoryCarts.set(cart.userId, saved);
      return saved;
    }

    try {
      const record = await this.cartModel
        .findOneAndUpdate(
          { userId: cart.userId },
          {
            userId: cart.userId,
            items: cart.items.map((item) => ({
              productId: item.productId,
              name: item.name,
              category: item.category,
              description: item.description,
              imageUrl: item.imageUrl,
              price: item.price,
              quantity: item.quantity,
              selected: item.selected,
              favorite: item.favorite,
            })),
            promoCode: cart.promoCode,
            discountRate: cart.discountRate,
          },
          { upsert: true, new: true },
        )
        .exec();

      return this.toEntity(record);
    } catch {
      const saved = new CartEntity(
        cart.id ?? `mem-cart-${cart.userId}`,
        cart.userId,
        cart.items,
        cart.promoCode,
        cart.discountRate,
      );
      this.memoryCarts.set(cart.userId, saved);
      return saved;
    }
  }

  private toEntity(record: HydratedDocument<CartMongoDocument>): CartEntity {
    const items = (record.items ?? []).map(
      (item) =>
        new CartItemEntity(
          item.productId,
          item.name,
          item.category,
          item.description ?? '',
          item.imageUrl ?? '',
          item.price,
          item.quantity,
          item.selected ?? true,
          item.favorite ?? false,
        ),
    );

    return new CartEntity(
      String(record._id),
      record.userId,
      items,
      record.promoCode ?? null,
      record.discountRate ?? 0,
    );
  }
}
