import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Inject,
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
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case.js';
import {
	InvalidProductError,
	type ProductData,
} from '../../domain/entities/product.entity.js';
import { CategoryNotFoundError } from '../../application/errors/category.errors.js';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/ports/product.repository.js';
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
		private readonly updateProduct: UpdateProductUseCase,
		@Inject(PRODUCT_REPOSITORY)
		private readonly productRepository: ProductRepository,
	) {}

	@Get()
	findAll(@Query('profileId') profileId?: string) {
		return this.listProducts.execute(profileId);
	}

	@Get('manage')
	@UseGuards(CatalogAuthGuard)
	listForManagement(
		@Req() request: AuthenticatedProductRequest,
	) {
		return this.listProducts.execute(request.user.sub, true);
	}

	@Get('moderation')
	@UseGuards(AdminAuthGuard)
	listForModeration() {
		return this.listProducts.execute(undefined, true);
	}

	@Get('image-references')
	@UseGuards(CatalogAuthGuard)
	async countImageReferences(
		@Query('imageUrl') imageUrl: string,
	) {
		if (!imageUrl) throw new BadRequestException('La imagen no es válida');
		return { references: await this.productRepository.countImageReferences(imageUrl) };
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

	@Patch(':id/restore')
	@UseGuards(CatalogAuthGuard)
	async restore(
		@Param('id') id: string,
		@Req() request: AuthenticatedProductRequest,
	) {
		const product = await this.setProductActive.execute(id, true, request.user.sub);
		if (!product) throw new NotFoundException('Product not found');
		return product;
	}

	@Delete(':id/moderation')
	@UseGuards(AdminAuthGuard)
	async removeForModeration(@Param('id') id: string) {
		const product = await this.setProductActive.execute(id, false);
		if (!product) throw new NotFoundException('Product not found');
		return product;
	}

	@Patch(':id')
	@UseGuards(CatalogAuthGuard)
	async update(
		@Param('id') id: string,
		@Body() input: Partial<ProductData>,
		@Req() request: AuthenticatedProductRequest,
	) {
		try {
			const product = await this.updateProduct.execute(id, input, request.user.sub);
			if (!product) throw new NotFoundException('Product not found');
			return product;
		} catch (error) {
			if (error instanceof InvalidProductError || error instanceof CategoryNotFoundError) {
				throw new BadRequestException(error.message);
			}
			throw error;
		}
	}

	@Delete(':id')
	@UseGuards(CatalogAuthGuard)
	async remove(
		@Param('id') id: string,
		@Req() request: AuthenticatedProductRequest,
	) {
		const product = await this.setProductActive.execute(id, false, request.user.sub);
		if (!product) throw new NotFoundException('Product not found');
		return product;
	}

	@Delete(':id/image')
	@UseGuards(CatalogAuthGuard)
	async cleanupImage(
		@Param('id') id: string,
		@Body() input: { imageUrl?: unknown },
		@Req() request: AuthenticatedProductRequest,
	) {
		if (typeof input.imageUrl !== 'string' || !input.imageUrl) {
			throw new BadRequestException('La imagen anterior no es válida');
		}
		const product = await this.getProduct.execute(id);
		if (!product || product.profileId !== request.user.sub) {
			throw new NotFoundException('Product not found');
		}
		if (product.imageUrl === input.imageUrl) return { safeToDelete: false };
		const references = await this.productRepository.countImageReferences(
			input.imageUrl,
			id,
		);
		return { safeToDelete: references === 0 };
	}
}