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
  Req,
  UseGuards,
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
import {
  OrdersAuthGuard,
  type AuthenticatedOrdersRequest,
} from './orders-auth.guard.js';

@Controller()
@UseGuards(OrdersAuthGuard)
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
  async getCart(
    @Req() request: AuthenticatedOrdersRequest,
    @Query('userId') userId = 'default-user',
    @Query('storeProfileId') storeProfileId = 'default-store',
    @Query('shippingCost') shippingCost = '8000',
  ) {
    try {
      const cart = await this.getCartUseCase.execute(
        request.user.sub || userId,
        storeProfileId,
        this.parseShippingCost(shippingCost),
      );
      return cart.toJSON();
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Post('cart/items')
  async addItem(
    @Req() request: AuthenticatedOrdersRequest,
    @Body() body: {
      userId?: string;
      item: CartItemData;
      storeProfileId?: string;
      shippingCost?: number;
    },
  ) {
    try {
      const userId = request.user.sub;
      const storeProfileId = body?.storeProfileId || 'default-store';
      const shippingCost = this.parseShippingCost(String(body?.shippingCost ?? 8000));
      const cart = await this.addCartItemUseCase.execute(
        userId,
        body?.item,
        storeProfileId,
        shippingCost,
      );
      return cart.toJSON();
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Patch('cart/items/:productId')
  async updateItem(
    @Param('productId') productId: string,
    @Req() request: AuthenticatedOrdersRequest,
    @Body() body: { userId?: string; storeProfileId?: string; shippingCost?: number } & UpdateCartItemInput,
  ) {
    try {
      const userId = request.user.sub;
      const storeProfileId = body?.storeProfileId || 'default-store';
      const shippingCost = this.parseShippingCost(String(body?.shippingCost ?? 8000));
      const cart = await this.updateCartItemUseCase.execute(
        userId,
        productId,
        {
          quantity: body.quantity,
          selected: body.selected,
          favorite: body.favorite,
        },
        storeProfileId,
        shippingCost,
      );
      return cart.toJSON();
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Delete('cart/items/:productId')
  async removeItem(
    @Param('productId') productId: string,
    @Req() request: AuthenticatedOrdersRequest,
    @Query('userId') userId = 'default-user',
    @Query('storeProfileId') storeProfileId = 'default-store',
    @Query('shippingCost') shippingCost = '8000',
  ) {
    try {
      const cart = await this.removeCartItemUseCase.execute(
        request.user.sub || userId,
        productId,
        storeProfileId,
        this.parseShippingCost(shippingCost),
      );
      return cart.toJSON();
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Delete('cart')
  async clearCart(
    @Req() request: AuthenticatedOrdersRequest,
    @Query('userId') userId = 'default-user',
    @Query('storeProfileId') storeProfileId = 'default-store',
    @Query('shippingCost') shippingCost = '8000',
  ) {
    try {
      const cart = await this.clearCartUseCase.execute(
        request.user.sub || userId,
        storeProfileId,
        this.parseShippingCost(shippingCost),
      );
      return cart.toJSON();
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Post('cart/promo')
  async applyPromo(
    @Req() request: AuthenticatedOrdersRequest,
    @Body() body: {
      userId?: string;
      promoCode?: string;
      storeProfileId?: string;
      shippingCost?: number;
    },
  ) {
    try {
      const userId = request.user.sub;
      const storeProfileId = body?.storeProfileId || 'default-store';
      const shippingCost = this.parseShippingCost(String(body?.shippingCost ?? 8000));
      const cart = await this.applyPromoCodeUseCase.execute(
        userId,
        body?.promoCode ?? '',
        storeProfileId,
        shippingCost,
      );
      return cart.toJSON();
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Post('orders/checkout')
  async checkout(
    @Req() request: AuthenticatedOrdersRequest,
    @Body() body: {
      userId?: string;
      checkoutMode?: CheckoutMode;
      storeProfileId?: string;
      deliveryAddress?: string;
      shippingCost?: number;
    },
  ) {
    try {
      const userId = request.user.sub;
      const mode: CheckoutMode =
        body?.checkoutMode === 'GUEST' ? 'GUEST' : 'AUTHENTICATED';
      const result = await this.checkoutOrderUseCase.execute(
        userId,
        mode,
        body?.storeProfileId || 'default-store',
        body?.deliveryAddress ?? '',
        this.parseShippingCost(String(body?.shippingCost ?? 8000)),
      );
      return {
        order: result.order,
        cart: result.cart.toJSON(),
      };
    } catch (error) {
      this.handleDomainError(error);
    }
  }

  @Get('orders')
  async listOrders(
    @Req() request: AuthenticatedOrdersRequest,
    @Query('userId') userId = 'default-user',
  ) {
    try {
      return await this.listOrdersUseCase.execute(request.user.sub || userId);
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

  private parseShippingCost(value: string): number {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 0) {
      throw new BadRequestException('El costo de envío no es válido');
    }
    return parsed;
  }
}
