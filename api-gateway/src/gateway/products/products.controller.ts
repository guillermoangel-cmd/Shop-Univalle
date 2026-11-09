import {
	Body,
	Controller,
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

	@Get('manage')
	listForManagement(
		@Query('profileId') profileId?: string,
		@Headers('authorization') authorization?: string,
	) {
		const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
		return this.forward('get', `/products/manage${query}`, undefined, authorization);
	}

	@Get()
	findAll(@Query('profileId') profileId?: string) {
		const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
		return this.forward('get', `/products${query}`);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.forward('get', `/products/${encodeURIComponent(id)}`);
	}

	@Post()
	create(@Body() input: unknown, @Headers('authorization') authorization?: string) {
		return this.forward('post', '/products', input, authorization);
	}

	@Patch(':id/status')
	setStatus(
		@Param('id') id: string,
		@Body() input: unknown,
		@Headers('authorization') authorization?: string,
	) {
		return this.forward(
			'patch',
			`/products/${encodeURIComponent(id)}/status`,
			input,
			authorization,
		);
	}

	private async forward(
		method: 'get' | 'post' | 'patch',
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
