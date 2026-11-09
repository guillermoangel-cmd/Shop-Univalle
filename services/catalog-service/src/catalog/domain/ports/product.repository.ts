import type { ProductEntity } from '../entities/product.entity.js';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
	findAll(profileId?: string, includeInactive?: boolean): Promise<ProductEntity[]>;
	findById(id: string, profileId?: string, includeInactive?: boolean): Promise<ProductEntity | null>;
	findByCategoryId(id: string, profileId?: string): Promise<number>;
	countImageReferences(imageUrl: string, excludeId?: string): Promise<number>;
	updateCategoryName(categoryId: string, name: string, profileId?: string): Promise<void>;
	save(product: ProductEntity): Promise<ProductEntity>;
	update(product: ProductEntity, profileId: string): Promise<ProductEntity | null>;
	setActive(id: string, active: boolean, profileId?: string): Promise<ProductEntity | null>;
}