import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CategoryEntity } from '../../domain/entities/category.entity.js';
import { ProductEntity } from '../../domain/entities/product.entity.js';
import type { CategoryRepository } from '../../domain/ports/category.repository.js';
import type { ProductRepository } from '../../domain/ports/product.repository.js';
import { CategoryNotFoundError } from '../errors/category.errors.js';
import { UpdateProductUseCase } from './update-product.use-case.js';

describe('UpdateProductUseCase', () => {
	const existing = new ProductEntity(
		'product-id',
		'Jugo',
		'Natural',
		'/old-image.png',
		'Bebidas',
		5000,
		4,
		'category-id',
		'seller-id',
	);
	const nextCategory = new CategoryEntity('next-category', 'Frutas', '', true, 'seller-id');
	const categories: CategoryRepository = {
		findAll: jest.fn(),
		findById: jest.fn(async () => nextCategory),
		findByName: jest.fn(),
		save: jest.fn(),
		update: jest.fn(),
	};
	const products: ProductRepository = {
		findAll: jest.fn(),
		findById: jest.fn(async () => existing),
		findByCategoryId: jest.fn(),
		countImageReferences: jest.fn(),
		updateCategoryName: jest.fn(),
		save: jest.fn(),
		update: jest.fn(async (product) => product),
		setActive: jest.fn(),
	};
	const useCase = new UpdateProductUseCase(products, categories);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('updates supplied fields, preserves others, and changes category by owned id', async () => {
		const updated = await useCase.execute('product-id', {
			name: 'Jugo de mango',
			categoryId: 'next-category',
		}, 'seller-id');

		expect(updated).toMatchObject({
			id: 'product-id',
			name: 'Jugo de mango',
			description: 'Natural',
			imageUrl: '/old-image.png',
			category: 'Frutas',
			price: 5000,
			stock: 4,
			profileId: 'seller-id',
		});
		expect(products.findById).toHaveBeenCalledWith('product-id', 'seller-id', true);
		expect(products.update).toHaveBeenCalledWith(expect.any(ProductEntity), 'seller-id');
	});

	it('does not update a product that belongs to another seller', async () => {
		jest.mocked(products.findById).mockResolvedValueOnce(null);
		await expect(useCase.execute('product-id', { name: 'Otro' }, 'other-seller')).resolves.toBeNull();
		expect(products.update).not.toHaveBeenCalled();
	});

	it('rejects categories not owned by the seller', async () => {
		jest.mocked(categories.findById).mockResolvedValueOnce(null);
		await expect(useCase.execute('product-id', { categoryId: 'foreign-category' }, 'seller-id'))
			.rejects.toThrow(CategoryNotFoundError);
	});
});
