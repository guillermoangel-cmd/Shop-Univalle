import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Controller('api')
export class OrdersController {
  private readonly ordersServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.ordersServiceUrl =
      this.config.get<string>('ORDERS_SERVICE_URL') ?? 'http://localhost:3004';
  }

  @Get('cart')
  async getCart(@Query('userId') userId = 'default-user') {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.ordersServiceUrl}/cart`, {
          params: { userId },
        }),
      );
      return response.data;
    } catch (error) {
      this.rethrowError(error);
    }
  }

  @Post('cart/items')
  async addCartItem(@Body() body: unknown) {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.ordersServiceUrl}/cart/items`, body),
      );
      return response.data;
    } catch (error) {
      this.rethrowError(error);
    }
  }

  @Patch('cart/items/:productId')
  async updateCartItem(
    @Param('productId') productId: string,
    @Body() body: unknown,
  ) {
    try {
      const response = await firstValueFrom(
        this.http.patch(
          `${this.ordersServiceUrl}/cart/items/${encodeURIComponent(productId)}`,
          body,
        ),
      );
      return response.data;
    } catch (error) {
      this.rethrowError(error);
    }
  }

  @Delete('cart/items/:productId')
  async removeCartItem(
    @Param('productId') productId: string,
    @Query('userId') userId = 'default-user',
  ) {
    try {
      const response = await firstValueFrom(
        this.http.delete(
          `${this.ordersServiceUrl}/cart/items/${encodeURIComponent(productId)}`,
          { params: { userId } },
        ),
      );
      return response.data;
    } catch (error) {
      this.rethrowError(error);
    }
  }

  @Delete('cart')
  async clearCart(@Query('userId') userId = 'default-user') {
    try {
      const response = await firstValueFrom(
        this.http.delete(`${this.ordersServiceUrl}/cart`, {
          params: { userId },
        }),
      );
      return response.data;
    } catch (error) {
      this.rethrowError(error);
    }
  }

  @Post('cart/promo')
  async applyPromo(@Body() body: unknown) {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.ordersServiceUrl}/cart/promo`, body),
      );
      return response.data;
    } catch (error) {
      this.rethrowError(error);
    }
  }

  @Post('orders/checkout')
  async checkout(@Body() body: unknown) {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.ordersServiceUrl}/orders/checkout`, body),
      );
      return response.data;
    } catch (error) {
      this.rethrowError(error);
    }
  }

  @Get('orders')
  async listOrders(@Query('userId') userId = 'default-user') {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.ordersServiceUrl}/orders`, {
          params: { userId },
        }),
      );
      return response.data;
    } catch (error) {
      this.rethrowError(error);
    }
  }

  private rethrowError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'status' in error.response &&
      'data' in error.response
    ) {
      throw new HttpException(
        error.response.data as Record<string, unknown> | string,
        error.response.status as number,
      );
    }
    throw new HttpException(
      'Error al comunicarse con el servicio de pedidos (orders-service)',
      HttpStatus.BAD_GATEWAY,
    );
  }
}

