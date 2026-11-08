import type { ProductEntity } from '../entities/product.entity.js';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
	findAll(): Promise<ProductEntity[]>;
	findById(id: string): Promise<ProductEntity | null>;
	findByCategoryId(id: string): Promise<number>;
	updateCategoryName(categoryId: string, name: string): Promise<void>;
	save(product: ProductEntity): Promise<ProductEntity>;
}