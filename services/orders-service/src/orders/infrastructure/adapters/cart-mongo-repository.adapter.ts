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
  private indexMigration: Promise<void> | null = null;

  private cartKey(userId: string, storeProfileId: string): string {
    return `${userId}:${storeProfileId}`;
  }

  constructor(
    @InjectModel(CartMongoDocument.name)
    private readonly cartModel: Model<CartMongoDocument>,
  ) {}

  private isMongoConnected(): boolean {
    return Number(this.cartModel?.db?.readyState) === 1;
  }

  private async migrateCartIndexes(): Promise<void> {
    if (!this.indexMigration) {
      this.indexMigration = (async () => {
        await this.cartModel.collection.updateMany(
          { storeProfileId: { $exists: false } },
          { $set: { storeProfileId: 'default-store', shippingCost: 8000 } },
        );
        const indexes = await this.cartModel.collection.indexes();
        for (const index of indexes) {
          if (
            index.unique &&
            index.key.userId === 1 &&
            Object.keys(index.key).length === 1 &&
            index.name
          ) {
            await this.cartModel.collection.dropIndex(index.name);
          }
        }
      })();
    }
    await this.indexMigration;
  }

  async findByUserId(
    userId: string,
    storeProfileId = 'default-store',
  ): Promise<CartEntity | null> {
    if (!this.isMongoConnected()) {
      return this.memoryCarts.get(this.cartKey(userId, storeProfileId)) ?? null;
    }

    await this.migrateCartIndexes();
    try {
      const record = await this.cartModel.findOne({ userId, storeProfileId }).exec();
      return record ? this.toEntity(record) : null;
    } catch {
      return this.memoryCarts.get(this.cartKey(userId, storeProfileId)) ?? null;
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
        cart.storeProfileId,
        cart.shippingCost,
      );
      this.memoryCarts.set(this.cartKey(cart.userId, cart.storeProfileId), saved);
      return saved;
    }

    await this.migrateCartIndexes();
    try {
      const record = await this.cartModel
        .findOneAndUpdate(
          { userId: cart.userId, storeProfileId: cart.storeProfileId },
          {
            userId: cart.userId,
            storeProfileId: cart.storeProfileId,
            shippingCost: cart.shippingCost,
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
          { upsert: true, new: true, setDefaultsOnInsert: true },
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
        cart.storeProfileId,
        cart.shippingCost,
      );
      this.memoryCarts.set(this.cartKey(cart.userId, cart.storeProfileId), saved);
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
      record.storeProfileId ?? 'default-store',
      record.shippingCost ?? 8000,
    );
  }
}
