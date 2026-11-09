import {
	CategoryHasProductsError,
	CategoryNotFoundError,
} from '../errors/category.errors.js';
import type { CategoryRepository } from '../../domain/ports/category.repository.js';
import type { ProductRepository } from '../../domain/ports/product.repository.js';

export class DeactivateCategoryUseCase {
	constructor(
		private readonly categoryRepository: CategoryRepository,
		private readonly productRepository: ProductRepository,
	) {}

	async execute(id: string, profileId?: string) {
		const category = await this.categoryRepository.findById(id, profileId);
		if (!category || !category.active) {
			throw new CategoryNotFoundError('La categoría no existe o ya está inactiva');
		}
		if (await this.productRepository.findByCategoryId(id, profileId)) {
			throw new CategoryHasProductsError(
				'Reasigna o elimina los productos antes de desactivar esta categoría',
			);
		}
		const result = await this.categoryRepository.update(category.deactivate());
		if (!result) {
			throw new CategoryNotFoundError('La categoría dejó de existir durante la desactivación');
		}
		return result;
	}
}
