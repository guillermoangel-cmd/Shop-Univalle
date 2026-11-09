import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Headers,
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
  private readonly userServiceUrl: string;
  private readonly catalogServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.ordersServiceUrl =
      this.config.get<string>('ORDERS_SERVICE_URL') ?? 'http://localhost:3004';
    this.userServiceUrl =
      this.config.get<string>('USER_SERVICE_URL') ?? 'http://localhost:3003';
    this.catalogServiceUrl =
      this.config.get<string>('CATALOG_SERVICE_URL') ?? 'http://localhost:3002';
  }

  @Get('cart')
  async getCart(
    @Query('userId') userId = 'default-user',
    @Query('storeProfileId') storeProfileId = 'default-store',
    @Query('shippingCost') shippingCost = '8000',
    @Headers('authorization') authorization?: string,
  ) {
    try {
      const profile = await this.getStoreProfile(storeProfileId);
      const response = await firstValueFrom(
        this.http.get(`${this.ordersServiceUrl}/cart`, {
          params: {
            userId,
            storeProfileId: profile.id,
            shippingCost: profile.shippingCost,
          },
          headers: authorization ? { authorization } : undefined,
        }),
      );
      return response.data;
    } catch (error) {
      this.rethrowError(error);
    }
  }

  @Post('cart/items')
  async addCartItem(
    @Body() body: unknown,
    @Headers('authorization') authorization?: string,
  ) {
    try {
      const input = this.asRecord(body);
      const profile = await this.getStoreProfile(this.readString(input.storeProfileId, 'storeProfileId'));
      const item = await this.getProductForStore(input.item, profile.id);
      const response = await firstValueFrom(
        this.http.post(`${this.ordersServiceUrl}/cart/items`, {
          ...input,
          item,
          storeProfileId: profile.id,
          shippingCost: profile.shippingCost,
        }, {
          headers: authorization ? { authorization } : undefined,
        }),
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
    @Headers('authorization') authorization?: string,
  ) {
    try {
      const input = this.asRecord(body);
      const profileId = this.readString(input.storeProfileId, 'storeProfileId');
      const profile = await this.getStoreProfile(profileId);
      const response = await firstValueFrom(
        this.http.patch(
          `${this.ordersServiceUrl}/cart/items/${encodeURIComponent(productId)}`,
          {
            ...input,
            storeProfileId: profile.id,
            shippingCost: profile.shippingCost,
          },
          { headers: authorization ? { authorization } : undefined },
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
    @Query('storeProfileId') storeProfileId = 'default-store',
    @Query('shippingCost') shippingCost = '8000',
    @Headers('authorization') authorization?: string,
  ) {
    try {
      const response = await firstValueFrom(
        this.http.delete(
          `${this.ordersServiceUrl}/cart/items/${encodeURIComponent(productId)}`,
          {
            params: { userId, storeProfileId, shippingCost },
            headers: authorization ? { authorization } : undefined,
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.rethrowError(error);
    }
  }

  @Delete('cart')
  async clearCart(
    @Query('userId') userId = 'default-user',
    @Query('storeProfileId') storeProfileId = 'default-store',
    @Query('shippingCost') shippingCost = '8000',
    @Headers('authorization') authorization?: string,
  ) {
    try {
      const response = await firstValueFrom(
        this.http.delete(`${this.ordersServiceUrl}/cart`, {
          params: { userId, storeProfileId, shippingCost },
          headers: authorization ? { authorization } : undefined,
        }),
      );
      return response.data;
    } catch (error) {
      this.rethrowError(error);
    }
  }

  @Post('cart/promo')
  async applyPromo(
    @Body() body: unknown,
    @Headers('authorization') authorization?: string,
  ) {
    try {
      const input = this.asRecord(body);
      const profile = await this.getStoreProfile(
        this.readString(input.storeProfileId, 'storeProfileId'),
      );
      const response = await firstValueFrom(
        this.http.post(`${this.ordersServiceUrl}/cart/promo`, {
          ...input,
          storeProfileId: profile.id,
          shippingCost: profile.shippingCost,
        }, {
          headers: authorization ? { authorization } : undefined,
        }),
      );
      return response.data;
    } catch (error) {
      this.rethrowError(error);
    }
  }

  @Post('orders/checkout')
  async checkout(
    @Body() body: unknown,
    @Headers('authorization') authorization?: string,
  ) {
    try {
      const input = this.asRecord(body);
      const profile = await this.getStoreProfile(
        this.readString(input.storeProfileId, 'storeProfileId'),
      );
      const authResponse = await firstValueFrom(
        this.http.get(`${this.userServiceUrl}/users/me`, {
          headers: authorization ? { authorization } : undefined,
        }),
      );
      const user = this.asRecord(authResponse.data);
      const addressList = Array.isArray(user.addresses) ? user.addresses : [];
      const address = addressList
        .map((item) => this.asRecord(item))
        .find((item) => item.id === user.selectedAddressId);
      if (!address || typeof address.address !== 'string') {
        throw new BadRequestException('Agrega y selecciona una dirección de entrega antes de pagar');
      }
      const deliveryAddress = [
        address.label,
        address.address,
        address.details,
      ].filter((part) => typeof part === 'string' && part).join(' · ');
      const response = await firstValueFrom(
        this.http.post(`${this.ordersServiceUrl}/orders/checkout`, {
          ...input,
          storeProfileId: profile.id,
          shippingCost: profile.shippingCost,
          deliveryAddress,
        }, {
          headers: authorization ? { authorization } : undefined,
        }),
      );
      return response.data;
    } catch (error) {
      this.rethrowError(error);
    }
  }

  @Get('orders')
  async listOrders(
    @Query('userId') userId = 'default-user',
    @Headers('authorization') authorization?: string,
  ) {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.ordersServiceUrl}/orders`, {
          params: { userId },
          headers: authorization ? { authorization } : undefined,
        }),
      );
      return response.data;
    } catch (error) {
      this.rethrowError(error);
    }
  }

  private rethrowError(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }
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

  private asRecord(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new BadRequestException('Los datos de la solicitud no son válidos');
    }
    return value as Record<string, unknown>;
  }

  private readString(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`El campo ${field} es obligatorio`);
    }
    return value.trim();
  }

  private async getStoreProfile(profileId: string): Promise<{
    id: string;
    shippingCost: number;
  }> {
    try {
      const response = await firstValueFrom(
        this.http.get(
          `${this.userServiceUrl}/profiles/${encodeURIComponent(profileId)}`,
        ),
      );
      const profile = this.asRecord(response.data);
      if (
        profile.id !== profileId ||
        typeof profile.shippingCost !== 'number' ||
        !Number.isSafeInteger(profile.shippingCost) ||
        profile.shippingCost < 0
      ) {
        throw new BadRequestException('La configuración de la tienda no es válida');
      }
      return { id: profileId, shippingCost: profile.shippingCost };
    } catch (error) {
      this.rethrowError(error);
    }
  }

  private async getProductForStore(itemValue: unknown, profileId: string) {
    const item = this.asRecord(itemValue);
    const productId = this.readString(item.productId, 'productId');
    try {
      const response = await firstValueFrom(
        this.http.get(
          `${this.catalogServiceUrl}/products/${encodeURIComponent(productId)}`,
        ),
      );
      const product = this.asRecord(response.data);
      const quantity = item.quantity ?? 1;
      if (
        product.profileId !== profileId ||
        typeof product.price !== 'number' ||
        typeof product.stock !== 'number' ||
        typeof quantity !== 'number' ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > product.stock
      ) {
        throw new BadRequestException('El producto no pertenece a esta tienda o no tiene existencias suficientes');
      }
      return {
        productId,
        name: this.readString(product.name, 'name'),
        category: this.readString(product.category, 'category'),
        description: typeof product.description === 'string' ? product.description : '',
        imageUrl: typeof product.imageUrl === 'string' ? product.imageUrl : '',
        price: product.price,
        quantity,
      };
    } catch (error) {
      this.rethrowError(error);
    }
  }
}
