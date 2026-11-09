import { CategoryNotFoundError } from '../errors/category.errors.js';
import { CategoryAlreadyExistsError } from '../errors/category.errors.js';
import type { CategoryData } from '../../domain/entities/category.entity.js';
import type { CategoryRepository } from '../../domain/ports/category.repository.js';
import type { ProductRepository } from '../../domain/ports/product.repository.js';

export class UpdateCategoryUseCase {
	constructor(
		private readonly categoryRepository: CategoryRepository,
		private readonly productRepository: ProductRepository,
	) {}

	async execute(id: string, input: Partial<CategoryData>, profileId?: string) {
		const category = await this.categoryRepository.findById(id, profileId);
		if (!category || !category.active) {
			throw new CategoryNotFoundError('La categoría no existe o está inactiva');
		}

		const updated = category.update(input);
		const existing = await this.categoryRepository.findByName(updated.name, profileId);
		if (existing && existing.id !== id) {
			throw new CategoryAlreadyExistsError('Ya existe una categoría con ese nombre');
		}
		const result = await this.categoryRepository.update(updated);
		if (!result) {
			throw new CategoryNotFoundError('La categoría dejó de existir durante la actualización');
		}
		if (result.name !== category.name) {
			await this.productRepository.updateCategoryName(id, result.name, profileId);
		}
		return result;
	}
}
