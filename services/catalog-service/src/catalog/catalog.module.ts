import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case.js';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case.js';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case.js';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case.js';
import { DeactivateCategoryUseCase } from './application/use-cases/deactivate-category.use-case.js';
import { ActivateCategoryUseCase } from './application/use-cases/activate-category.use-case.js';
import { GetProductUseCase } from './application/use-cases/get-product.use-case.js';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case.js';
import {
	PRODUCT_REPOSITORY,
	type ProductRepository,
} from './domain/ports/product.repository.js';
import {
	CATEGORY_REPOSITORY,
	type CategoryRepository,
} from './domain/ports/category.repository.js';
import { ProductMongoRepositoryAdapter } from './infrastructure/adapters/product-mongo-repository.adapter.js';
import { CategoryMongoRepositoryAdapter } from './infrastructure/adapters/category-mongo-repository.adapter.js';
import {
	ProductMongoDocument,
	ProductMongoSchema,
} from './infrastructure/persistence/product-mongo.schema.js';
import { ProductsController } from './infrastructure/http/products.controller.js';
import { CategoriesController } from './infrastructure/http/categories.controller.js';
import {
	CategoryMongoDocument,
	CategoryMongoSchema,
} from './infrastructure/persistence/category-mongo.schema.js';
import { AdminAuthGuard } from './infrastructure/http/admin-auth.guard.js';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: ProductMongoDocument.name, schema: ProductMongoSchema },
			{ name: CategoryMongoDocument.name, schema: CategoryMongoSchema },
		]),
	],
	controllers: [ProductsController, CategoriesController],
	providers: [
		ProductMongoRepositoryAdapter,
		CategoryMongoRepositoryAdapter,
		{ provide: PRODUCT_REPOSITORY, useExisting: ProductMongoRepositoryAdapter },
		{ provide: CATEGORY_REPOSITORY, useExisting: CategoryMongoRepositoryAdapter },
		{
			provide: CreateProductUseCase,
			useFactory: (repository: ProductRepository, categories: CategoryRepository) =>
				new CreateProductUseCase(repository, categories),
			inject: [PRODUCT_REPOSITORY, CATEGORY_REPOSITORY],
		},
		{
			provide: CreateCategoryUseCase,
			useFactory: (repository: CategoryRepository) => new CreateCategoryUseCase(repository),
			inject: [CATEGORY_REPOSITORY],
		},
		{
			provide: ListCategoriesUseCase,
			useFactory: (repository: CategoryRepository) => new ListCategoriesUseCase(repository),
			inject: [CATEGORY_REPOSITORY],
		},
		{
			provide: UpdateCategoryUseCase,
			useFactory: (categories: CategoryRepository, products: ProductRepository) =>
				new UpdateCategoryUseCase(categories, products),
			inject: [CATEGORY_REPOSITORY, PRODUCT_REPOSITORY],
		},
		{
			provide: DeactivateCategoryUseCase,
			useFactory: (categories: CategoryRepository, products: ProductRepository) =>
				new DeactivateCategoryUseCase(categories, products),
			inject: [CATEGORY_REPOSITORY, PRODUCT_REPOSITORY],
		},
		{
			provide: ActivateCategoryUseCase,
			useFactory: (categories: CategoryRepository) =>
				new ActivateCategoryUseCase(categories),
			inject: [CATEGORY_REPOSITORY],
		},
		AdminAuthGuard,
		{
			provide: GetProductUseCase,
			useFactory: (repository: ProductRepository) =>
				new GetProductUseCase(repository),
			inject: [PRODUCT_REPOSITORY],
		},
		{
			provide: ListProductsUseCase,
			useFactory: (repository: ProductRepository) =>
				new ListProductsUseCase(repository),
			inject: [PRODUCT_REPOSITORY],
		},
	],
})
export class CatalogModule {}