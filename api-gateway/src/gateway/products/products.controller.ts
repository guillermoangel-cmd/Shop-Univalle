import {
	Body,
	Controller,
	Get,
	Headers,
	HttpException,
	HttpStatus,
	Param,
	Post,
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
			this.config.get<string>('CATALOG_SERVICE_URL') ?? 'http://localhost:3002';
	}

	@Get()
	findAll() {
		return this.forward('get', '/products');
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.forward('get', `/products/${encodeURIComponent(id)}`);
	}

	@Post()
	create(@Body() input: unknown, @Headers('authorization') authorization?: string) {
		return this.forward('post', '/products', input, authorization);
	}

	private async forward(
		method: 'get' | 'post',
		path: string,
		input?: unknown,
		authorization?: string,
	) {
		try {
			const response = await firstValueFrom(this.http.request({
				method,
				url: `${this.catalogUrl}${path}`,
				data: input,
				headers: authorization ? { authorization } : undefined,
			}));
			return response.data;
		} catch (error) {
			if (
				typeof error === 'object' &&
				error !== null &&
				'response' in error &&
				error.response &&
				typeof error.response === 'object' &&
				'status' in error.response &&
				'data' in error.response &&
				typeof error.response.status === 'number'
			) {
				throw new HttpException(
					error.response.data as Record<string, unknown> | string,
					error.response.status,
				);
			}
			throw new HttpException(
				'Error al comunicarse con el servicio de catálogo',
				HttpStatus.BAD_GATEWAY,
			);
		}
	}
}
