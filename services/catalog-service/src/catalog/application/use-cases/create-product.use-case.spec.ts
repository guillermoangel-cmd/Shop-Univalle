import { describe, expect, it, jest } from '@jest/globals';
import { CategoryEntity } from '../../domain/entities/category.entity.js';
import { CategoryNotFoundError } from '../errors/category.errors.js';
import type { CategoryRepository } from '../../domain/ports/category.repository.js';
import type { ProductRepository } from '../../domain/ports/product.repository.js';
import { ProductEntity } from '../../domain/entities/product.entity.js';
import { CreateProductUseCase } from './create-product.use-case.js';

describe('CreateProductUseCase', () => {
	const category = new CategoryEntity('category-id', 'Bebidas', '', true, 'seller-id');
	const categories: CategoryRepository = {
		findAll: jest.fn(),
		findById: jest.fn(async () => category),
		findByName: jest.fn(),
		save: jest.fn(),
		update: jest.fn(),
	};
	const products: ProductRepository = {
		findAll: jest.fn(),
		findById: jest.fn(),
		findByCategoryId: jest.fn(),
		countImageReferences: jest.fn(),
		updateCategoryName: jest.fn(),
		save: jest.fn(async (product) => product),
		setActive: jest.fn(),
	};
	const useCase = new CreateProductUseCase(products, categories);

	it('uses the name of the selected category and persists its id', async () => {
		const created = await useCase.execute({
			name: 'Jugo natural',
			category: 'valor ignorado',
			categoryId: 'category-id',
			price: 8000,
			stock: 4,
		}, 'seller-id');

		expect(created.category).toBe('Bebidas');
		expect(created.categoryId).toBe('category-id');
		expect(created.profileId).toBe('seller-id');
		expect(categories.findById).toHaveBeenCalledWith('category-id', 'seller-id');
		expect(products.save).toHaveBeenCalledWith(expect.any(ProductEntity));
	});

	it('rejects missing and inactive categories', async () => {
		await expect(useCase.execute({
			name: 'Jugo natural',
			category: 'Bebidas',
			price: 8000,
			stock: 4,
		})).rejects.toThrow(CategoryNotFoundError);

		jest.mocked(categories.findById).mockResolvedValueOnce(
			new CategoryEntity('category-id', 'Bebidas', '', false, 'seller-id'),
		);
		await expect(useCase.execute({
			name: 'Jugo natural',
			category: 'Bebidas',
			categoryId: 'category-id',
			price: 8000,
			stock: 4,
		})).rejects.toThrow(CategoryNotFoundError);
	});
});
