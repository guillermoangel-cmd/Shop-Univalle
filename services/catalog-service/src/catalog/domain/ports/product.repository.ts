import type { ProductEntity } from '../entities/product.entity.js';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
	findAll(): Promise<ProductEntity[]>;
	findById(id: string): Promise<ProductEntity | null>;
	save(product: ProductEntity): Promise<ProductEntity>;
}