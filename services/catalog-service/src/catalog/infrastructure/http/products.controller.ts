import {
	BadRequestException,
	Body,
	Controller,
	Get,
	NotFoundException,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case.js';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case.js';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case.js';
import { SetProductActiveUseCase } from '../../application/use-cases/set-product-active.use-case.js';
import {
	InvalidProductError,
	type ProductData,
} from '../../domain/entities/product.entity.js';
import { CategoryNotFoundError } from '../../application/errors/category.errors.js';
import type { Request } from 'express';
import { AdminAuthGuard, CatalogAuthGuard } from './admin-auth.guard.js';

interface AuthenticatedProductRequest extends Request {
	user: { sub: string; email: string; role: string };
}

@Controller('products')
export class ProductsController {
	constructor(
		private readonly createProduct: CreateProductUseCase,
		private readonly getProduct: GetProductUseCase,
		private readonly listProducts: ListProductsUseCase,
		private readonly setProductActive: SetProductActiveUseCase,
	) {}

	@Get()
	findAll(@Query('profileId') profileId?: string) {
		return this.listProducts.execute(profileId);
	}

	@Get('manage')
	@UseGuards(CatalogAuthGuard)
	listForManagement(
		@Req() request: AuthenticatedProductRequest,
		@Query('profileId') profileId?: string,
	) {
		const targetProfile = request.user.role === 'ADMINISTRATIVO'
			? profileId
			: request.user.sub;
		return this.listProducts.execute(targetProfile, true);
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		const product = await this.getProduct.execute(id);
		if (!product) {
			throw new NotFoundException('Product not found');
		}
		return product;
	}

	@Post()
	@UseGuards(CatalogAuthGuard)
	async create(
		@Body() input: ProductData,
		@Req() request: AuthenticatedProductRequest,
	) {
		try {
			return await this.createProduct.execute(input, request.user.sub);
		} catch (error) {
			if (error instanceof InvalidProductError) {
				throw new BadRequestException(error.message);
			}
			if (error instanceof CategoryNotFoundError) {
				throw new BadRequestException(error.message);
			}
			throw error;
		}
	}

	@Patch(':id/status')
	@UseGuards(AdminAuthGuard)
	async setStatus(
		@Param('id') id: string,
		@Body() input: { active?: unknown },
	) {
		if (typeof input.active !== 'boolean') {
			throw new BadRequestException('El estado activo debe ser verdadero o falso');
		}
		const product = await this.setProductActive.execute(id, input.active);
		if (!product) {
			throw new NotFoundException('Product not found');
		}
		return product;
	}
}