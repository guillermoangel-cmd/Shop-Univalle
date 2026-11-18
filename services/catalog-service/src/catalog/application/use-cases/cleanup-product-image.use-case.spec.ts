import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ProductEntity } from '../../domain/entities/product.entity.js';
import type { ProductRepository } from '../../domain/ports/product.repository.js';
import { CleanupProductImageUseCase } from './cleanup-product-image.use-case.js';

describe('CleanupProductImageUseCase', () => {
	const product = new ProductEntity(
		'product-id',
		'Producto',
		'',
		'/old-image.png',
		'Categoría',
		10000,
		1,
		'category-id',
		'seller-id',
	);

	const repository: ProductRepository = {
		findAll: jest.fn(),
		findById: jest.fn(async () => product),
		findByCategoryId: jest.fn(),
		countImageReferences: jest.fn(async () => 0),
		updateCategoryName: jest.fn(),
		save: jest.fn(),
		update: jest.fn(),
		setActive: jest.fn(),
	};

	const useCase = new CleanupProductImageUseCase(repository);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns false when the image still belongs to the product', async () => {
		await expect(
			useCase.execute('product-id', '/old-image.png', 'seller-id'),
		).resolves.toBe(false);
		expect(repository.countImageReferences).not.toHaveBeenCalled();
	});

	it('returns true when no other product references the old image', async () => {
		await expect(
			useCase.execute('product-id', '/unreferenced.png', 'seller-id'),
		).resolves.toBe(true);
		expect(repository.countImageReferences).toHaveBeenCalledWith(
			'/unreferenced.png',
			'product-id',
		);
	});

	it('returns null when the product is not owned by the seller', async () => {
		jest.mocked(repository.findById).mockResolvedValueOnce(null);

		await expect(
			useCase.execute('product-id', '/old-image.png', 'other-seller'),
		).resolves.toBeNull();
	});
});
