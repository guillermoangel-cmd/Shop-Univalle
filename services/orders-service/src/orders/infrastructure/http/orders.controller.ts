import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AddCartItemUseCase } from '../../application/use-cases/add-cart-item.use-case.js';
import { ApplyPromoCodeUseCase } from '../../application/use-cases/apply-promo-code.use-case.js';
import { CheckoutOrderUseCase } from '../../application/use-cases/checkout-order.use-case.js';
import { ClearCartUseCase } from '../../application/use-cases/clear-cart.use-case.js';
import { GetCartUseCase } from '../../application/use-cases/get-cart.use-case.js';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case.js';
import { RemoveCartItemUseCase } from '../../application/use-cases/remove-cart-item.use-case.js';
import {
  UpdateCartItemUseCase,
  type UpdateCartItemInput,
} from '../../application/use-cases/update-cart-item.use-case.js';
import {
  InvalidCartError,
  type CartItemData,
} from '../../domain/entities/cart-item.entity.js';
import type { CheckoutMode } from '../../domain/entities/order.entity.js';

@Controller()
export class OrdersController {
  constructor(
    private readonly getCartUseCase: GetCartUseCase,
    private readonly addCartItemUseCase: AddCartItemUseCase,
    private readonly updateCartItemUseCase: UpdateCartItemUseCase,
    private readonly removeCartItemUseCase: RemoveCartItemUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
    private readonly applyPromoCodeUseCase: ApplyPromoCodeUseCase,
    private readonly checkoutOrderUseCase: CheckoutOrderUseCase,
    private readonly listOrdersUseCase: ListOrdersUseCase,
  ) {}

  @Get('cart')
  async getCart(@Query('userId') userId = 'default-user') {
    try {
      const cart = await this.getCartUseCase.execute(userId);
      return cart.toJSON();
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Post('cart/items')
  async addItem(
    @Body() body: { userId?: string; item: CartItemData },
  ) {
    try {
      const userId = body?.userId || 'default-user';
      const cart = await this.addCartItemUseCase.execute(userId, body?.item);
      return cart.toJSON();
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Patch('cart/items/:productId')
  async updateItem(
    @Param('productId') productId: string,
    @Body() body: { userId?: string } & UpdateCartItemInput,
  ) {
    try {
      const userId = body?.userId || 'default-user';
      const cart = await this.updateCartItemUseCase.execute(
        userId,
        productId,
        {
          quantity: body.quantity,
          selected: body.selected,
          favorite: body.favorite,
        },
      );
      return cart.toJSON();
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Delete('cart/items/:productId')
  async removeItem(
    @Param('productId') productId: string,
    @Query('userId') userId = 'default-user',
  ) {
    try {
      const cart = await this.removeCartItemUseCase.execute(userId, productId);
      return cart.toJSON();
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Delete('cart')
  async clearCart(@Query('userId') userId = 'default-user') {
    try {
      const cart = await this.clearCartUseCase.execute(userId);
      return cart.toJSON();
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Post('cart/promo')
  async applyPromo(
    @Body() body: { userId?: string; promoCode?: string },
  ) {
    try {
      const userId = body?.userId || 'default-user';
      const cart = await this.applyPromoCodeUseCase.execute(
        userId,
        body?.promoCode ?? '',
      );
      return cart.toJSON();
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Post('orders/checkout')
  async checkout(
    @Body() body: { userId?: string; checkoutMode?: CheckoutMode },
  ) {
    try {
      const userId = body?.userId || 'default-user';
      const mode: CheckoutMode =
        body?.checkoutMode === 'GUEST' ? 'GUEST' : 'AUTHENTICATED';
      const result = await this.checkoutOrderUseCase.execute(userId, mode);
      return {
        order: result.order,
        cart: result.cart.toJSON(),
      };
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Get('orders')
  async listOrders(@Query('userId') userId = 'default-user') {
    try {
      return await this.listOrdersUseCase.execute(userId);
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  private handleDomainError(error: unknown): never {
    if (error instanceof InvalidCartError) {
      throw new BadRequestException(error.message);
    }
    throw error;
  }
}

