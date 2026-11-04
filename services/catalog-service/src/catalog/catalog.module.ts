import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case.js';
import { GetProductUseCase } from './application/use-cases/get-product.use-case.js';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case.js';
import {
	PRODUCT_REPOSITORY,
	type ProductRepository,
} from './domain/ports/product.repository.js';
import { ProductMongoRepositoryAdapter } from './infrastructure/adapters/product-mongo-repository.adapter.js';
import {
	ProductMongoDocument,
	ProductMongoSchema,
} from './infrastructure/persistence/product-mongo.schema.js';
import { ProductsController } from './infrastructure/http/products.controller.js';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: ProductMongoDocument.name, schema: ProductMongoSchema },
		]),
	],
	controllers: [ProductsController],
	providers: [
		ProductMongoRepositoryAdapter,
		{ provide: PRODUCT_REPOSITORY, useExisting: ProductMongoRepositoryAdapter },
		{
			provide: CreateProductUseCase,
			useFactory: (repository: ProductRepository) =>
				new CreateProductUseCase(repository),
			inject: [PRODUCT_REPOSITORY],
		},
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