import type { CategoryEntity } from '../entities/category.entity.js';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface CategoryRepository {
	findAll(includeInactive?: boolean): Promise<CategoryEntity[]>;
	findById(id: string): Promise<CategoryEntity | null>;
	findByName(name: string): Promise<CategoryEntity | null>;
	save(category: CategoryEntity): Promise<CategoryEntity>;
	update(category: CategoryEntity): Promise<CategoryEntity | null>;
}
