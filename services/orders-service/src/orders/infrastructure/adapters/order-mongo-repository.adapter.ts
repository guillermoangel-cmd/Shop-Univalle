import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type HydratedDocument, type Model } from 'mongoose';
import { CartItemEntity } from '../../domain/entities/cart-item.entity.js';
import { OrderEntity } from '../../domain/entities/order.entity.js';
import type { OrderRepository } from '../../domain/ports/order.repository.js';
import { OrderMongoDocument } from '../persistence/order-mongo.schema.js';

@Injectable()
export class OrderMongoRepositoryAdapter implements OrderRepository {
  private readonly memoryOrders: OrderEntity[] = [];

  constructor(
    @InjectModel(OrderMongoDocument.name)
    private readonly orderModel: Model<OrderMongoDocument>,
  ) {}

  private isMongoConnected(): boolean {
    return Number(this.orderModel?.db?.readyState) === 1;
  }

  async save(order: OrderEntity): Promise<OrderEntity> {
    if (!this.isMongoConnected()) {
      const saved = new OrderEntity(
        order.id ?? `mem-ord-${Date.now()}`,
        order.orderNumber,
        order.userId,
        order.checkoutMode,
        order.items,
        order.totalItems,
        order.subtotal,
        order.discountAmount,
        order.estimatedShipping,
        order.taxes,
        order.totalFinal,
        order.promoCode,
        order.status,
        order.createdAt,
        order.storeProfileId,
        order.deliveryAddress,
      );
      this.memoryOrders.unshift(saved);
      return saved;
    }

    try {
      const record = await this.orderModel.create({
        orderNumber: order.orderNumber,
        userId: order.userId,
        storeProfileId: order.storeProfileId,
        deliveryAddress: order.deliveryAddress,
        checkoutMode: order.checkoutMode,
        items: order.items.map((item) => ({
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
        totalItems: order.totalItems,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        estimatedShipping: order.estimatedShipping,
        taxes: order.taxes,
        totalFinal: order.totalFinal,
        promoCode: order.promoCode,
        status: order.status,
      });

      return this.toEntity(record);
    } catch {
      const saved = new OrderEntity(
        order.id ?? `mem-ord-${Date.now()}`,
        order.orderNumber,
        order.userId,
        order.checkoutMode,
        order.items,
        order.totalItems,
        order.subtotal,
        order.discountAmount,
        order.estimatedShipping,
        order.taxes,
        order.totalFinal,
        order.promoCode,
        order.status,
        order.createdAt,
        order.storeProfileId,
        order.deliveryAddress,
      );
      this.memoryOrders.unshift(saved);
      return saved;
    }
  }

  async findByUserId(userId: string): Promise<OrderEntity[]> {
    if (!this.isMongoConnected()) {
      return this.memoryOrders.filter((o) => o.userId === userId);
    }

    try {
      const records = await this.orderModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .exec();
      return records.map((record) => this.toEntity(record));
    } catch {
      return this.memoryOrders.filter((o) => o.userId === userId);
    }
  }

  async findById(id: string): Promise<OrderEntity | null> {
    if (!this.isMongoConnected()) {
      return this.memoryOrders.find((o) => o.id === id) ?? null;
    }

    if (!Types.ObjectId.isValid(id)) {
      return this.memoryOrders.find((o) => o.id === id) ?? null;
    }
    try {
      const record = await this.orderModel.findById(id).exec();
      return record ? this.toEntity(record) : null;
    } catch {
      return this.memoryOrders.find((o) => o.id === id) ?? null;
    }
  }

  private toEntity(record: HydratedDocument<OrderMongoDocument>): OrderEntity {
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

    return new OrderEntity(
      String(record._id),
      record.orderNumber,
      record.userId,
      record.checkoutMode,
      items,
      record.totalItems,
      record.subtotal,
      record.discountAmount,
      record.estimatedShipping,
      record.taxes,
      record.totalFinal,
      record.promoCode ?? null,
      record.status,
      record.createdAt ?? new Date(),
      record.storeProfileId ?? 'default-store',
      record.deliveryAddress ?? '',
    );
  }
}
