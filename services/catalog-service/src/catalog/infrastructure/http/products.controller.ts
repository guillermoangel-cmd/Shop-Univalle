import {
	BadRequestException,
	Body,
	Controller,
	Get,
	NotFoundException,
	Param,
	Post,
	UseGuards,
} from '@nestjs/common';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case.js';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case.js';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case.js';
import {
	InvalidProductError,
	type ProductData,
} from '../../domain/entities/product.entity.js';
import { CategoryNotFoundError } from '../../application/errors/category.errors.js';
import { AdminAuthGuard } from './admin-auth.guard.js';

@Controller('products')
export class ProductsController {
	constructor(
		private readonly createProduct: CreateProductUseCase,
		private readonly getProduct: GetProductUseCase,
		private readonly listProducts: ListProductsUseCase,
	) {}

	@Get()
	findAll() {
		return this.listProducts.execute();
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
	@UseGuards(AdminAuthGuard)
	async create(@Body() input: ProductData) {
		try {
			return await this.createProduct.execute(input);
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
}