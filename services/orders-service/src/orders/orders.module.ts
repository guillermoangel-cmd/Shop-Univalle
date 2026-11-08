import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddCartItemUseCase } from './application/use-cases/add-cart-item.use-case.js';
import { ApplyPromoCodeUseCase } from './application/use-cases/apply-promo-code.use-case.js';
import { CheckoutOrderUseCase } from './application/use-cases/checkout-order.use-case.js';
import { ClearCartUseCase } from './application/use-cases/clear-cart.use-case.js';
import { GetCartUseCase } from './application/use-cases/get-cart.use-case.js';
import { ListOrdersUseCase } from './application/use-cases/list-orders.use-case.js';
import { RemoveCartItemUseCase } from './application/use-cases/remove-cart-item.use-case.js';
import { UpdateCartItemUseCase } from './application/use-cases/update-cart-item.use-case.js';
import {
  CART_REPOSITORY,
  type CartRepository,
} from './domain/ports/cart.repository.js';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from './domain/ports/order.repository.js';
import { CartMongoRepositoryAdapter } from './infrastructure/adapters/cart-mongo-repository.adapter.js';
import { OrderMongoRepositoryAdapter } from './infrastructure/adapters/order-mongo-repository.adapter.js';
import { OrdersController } from './infrastructure/http/orders.controller.js';
import {
  CartMongoDocument,
  CartMongoSchema,
} from './infrastructure/persistence/cart-mongo.schema.js';
import {
  OrderMongoDocument,
  OrderMongoSchema,
} from './infrastructure/persistence/order-mongo.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CartMongoDocument.name, schema: CartMongoSchema },
      { name: OrderMongoDocument.name, schema: OrderMongoSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [
    CartMongoRepositoryAdapter,
    OrderMongoRepositoryAdapter,
    { provide: CART_REPOSITORY, useExisting: CartMongoRepositoryAdapter },
    { provide: ORDER_REPOSITORY, useExisting: OrderMongoRepositoryAdapter },
    {
      provide: GetCartUseCase,
      useFactory: (cartRepository: CartRepository) =>
        new GetCartUseCase(cartRepository),
      inject: [CART_REPOSITORY],
    },
    {
      provide: AddCartItemUseCase,
      useFactory: (cartRepository: CartRepository) =>
        new AddCartItemUseCase(cartRepository),
      inject: [CART_REPOSITORY],
    },
    {
      provide: UpdateCartItemUseCase,
      useFactory: (cartRepository: CartRepository) =>
        new UpdateCartItemUseCase(cartRepository),
      inject: [CART_REPOSITORY],
    },
    {
      provide: RemoveCartItemUseCase,
      useFactory: (cartRepository: CartRepository) =>
        new RemoveCartItemUseCase(cartRepository),
      inject: [CART_REPOSITORY],
    },
    {
      provide: ClearCartUseCase,
      useFactory: (cartRepository: CartRepository) =>
        new ClearCartUseCase(cartRepository),
      inject: [CART_REPOSITORY],
    },
    {
      provide: ApplyPromoCodeUseCase,
      useFactory: (cartRepository: CartRepository) =>
        new ApplyPromoCodeUseCase(cartRepository),
      inject: [CART_REPOSITORY],
    },
    {
      provide: CheckoutOrderUseCase,
      useFactory: (
        cartRepository: CartRepository,
        orderRepository: OrderRepository,
      ) => new CheckoutOrderUseCase(cartRepository, orderRepository),
      inject: [CART_REPOSITORY, ORDER_REPOSITORY],
    },
    {
      provide: ListOrdersUseCase,
      useFactory: (orderRepository: OrderRepository) =>
        new ListOrdersUseCase(orderRepository),
      inject: [ORDER_REPOSITORY],
    },
  ],
})
export class OrdersModule {}

