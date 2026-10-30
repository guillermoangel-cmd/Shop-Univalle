import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Controller('api/products')
export class ProductsController {
  private readonly catalogUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.catalogUrl =
      this.config.get<string>('CATALOG_SERVICE_URL') ??
      'http://localhost:3002';
  }

  @Get()
  async findAll() {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.catalogUrl}/products`),
      );

      return response.data;
    } catch {
      throw new HttpException(
        'Error al comunicarse con el servicio de catálogo',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const response = await firstValueFrom(
        this.http.get(`${this.catalogUrl}/products/${encodeURIComponent(id)}`),
      );

      return response.data;
    } catch {
      throw new HttpException(
        'Error al consultar el producto',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}