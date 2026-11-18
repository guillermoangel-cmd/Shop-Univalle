import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CategoryEntity } from '../../domain/entities/category.entity.js';
import type { CategoryRepository } from '../../domain/ports/category.repository.js';
import type { ProductRepository } from '../../domain/ports/product.repository.js';
import { CategoryHasProductsError } from '../errors/category.errors.js';
import { DeactivateCategoryUseCase } from './deactivate-category.use-case.js';

describe('DeactivateCategoryUseCase', () => {
	const category = new CategoryEntity('category-id', 'Bebidas', '', true, 'seller-id');
	const categories: CategoryRepository = {
		findAll: jest.fn<CategoryRepository['findAll']>(async () => []),
		findById: jest.fn<CategoryRepository['findById']>(async () => category),
		findByName: jest.fn<CategoryRepository['findByName']>(async () => null),
		save: jest.fn<CategoryRepository['save']>(async (value) => value),
		update: jest.fn<CategoryRepository['update']>(async (value) => value),
	};
	const products: ProductRepository = {
		findAll: jest.fn<ProductRepository['findAll']>(async () => []),
		findById: jest.fn<ProductRepository['findById']>(async () => null),
		findByCategoryId: jest.fn<ProductRepository['findByCategoryId']>(async () => 1),
		countImageReferences: jest.fn<ProductRepository['countImageReferences']>(async () => 0),
		updateCategoryName: jest.fn<ProductRepository['updateCategoryName']>(async () => undefined),
		save: jest.fn<ProductRepository['save']>(async (value) => value),
		update: jest.fn<ProductRepository['update']>(async () => null),
		setActive: jest.fn<ProductRepository['setActive']>(async () => null),
	};
	const useCase = new DeactivateCategoryUseCase(categories, products);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('keeps seller category deletion blocked when products still use it', async () => {
		await expect(useCase.execute('category-id', 'seller-id'))
			.rejects.toThrow(CategoryHasProductsError);
		expect(categories.update).not.toHaveBeenCalled();
	});

	it('allows administrative category deletion with associated products', async () => {
		await expect(useCase.execute('category-id', undefined, true))
			.resolves.toMatchObject({ active: false, id: 'category-id' });
		expect(products.findByCategoryId).not.toHaveBeenCalled();
		expect(categories.update).toHaveBeenCalledWith(category.deactivate());
	});
});
