import { CategoryNotFoundError } from '../errors/category.errors.js';
import type { CategoryRepository } from '../../domain/ports/category.repository.js';
import type { ProductRepository } from '../../domain/ports/product.repository.js';
import {
	InvalidProductError,
	ProductEntity,
	type ProductData,
} from '../../domain/entities/product.entity.js';

export class UpdateProductUseCase {
	constructor(
		private readonly productRepository: ProductRepository,
		private readonly categoryRepository: CategoryRepository,
	) {}

	async execute(id: string, input: Partial<ProductData>, profileId: string) {
		if (!input || typeof input !== 'object') {
			throw new InvalidProductError('Los datos del producto no son válidos');
		}
		const existing = await this.productRepository.findById(id, profileId, true);
		if (!existing) return null;

		let categoryName = existing.category;
		let categoryId = existing.categoryId ?? undefined;
		if (input.categoryId !== undefined || existing.categoryId) {
			const selectedId = input.categoryId ?? existing.categoryId ?? '';
			const category = selectedId
				? await this.categoryRepository.findById(selectedId, profileId)
				: null;
			const unchangedInactiveCategory =
				selectedId === existing.categoryId && category && !category.active;
			if (!category || (!category.active && !unchangedInactiveCategory)) {
				throw new CategoryNotFoundError('La categoría seleccionada no existe o está inactiva');
			}
			categoryName = category.name;
			categoryId = selectedId;
		}

		const updated = ProductEntity.create({
			name: input.name ?? existing.name,
			description: input.description ?? existing.description,
			imageUrl: input.imageUrl ?? existing.imageUrl,
			category: categoryName,
			categoryId,
			price: input.price ?? existing.price,
			stock: input.stock ?? existing.stock,
			profileId,
		});
		return this.productRepository.update(
			new ProductEntity(
				existing.id,
				updated.name,
				updated.description,
				updated.imageUrl,
				updated.category,
				updated.price,
				updated.stock,
				updated.categoryId,
				profileId,
				existing.active,
			),
			profileId,
		);
	}
}
