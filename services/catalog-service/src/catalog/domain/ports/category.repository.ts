import type { CategoryEntity } from '../entities/category.entity.js';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface CategoryRepository {
	findAll(includeInactive?: boolean, profileId?: string): Promise<CategoryEntity[]>;
	findById(id: string, profileId?: string): Promise<CategoryEntity | null>;
	findByName(name: string, profileId?: string): Promise<CategoryEntity | null>;
	save(category: CategoryEntity): Promise<CategoryEntity>;
	update(category: CategoryEntity): Promise<CategoryEntity | null>;
}
