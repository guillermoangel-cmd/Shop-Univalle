import type { ProductEntity } from '../entities/product.entity.js';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
	findAll(profileId?: string, includeInactive?: boolean): Promise<ProductEntity[]>;
	findById(id: string): Promise<ProductEntity | null>;
	findByCategoryId(id: string, profileId?: string): Promise<number>;
	updateCategoryName(categoryId: string, name: string, profileId?: string): Promise<void>;
	save(product: ProductEntity): Promise<ProductEntity>;
	setActive(id: string, active: boolean): Promise<ProductEntity | null>;
}