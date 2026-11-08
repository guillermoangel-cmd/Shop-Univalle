import { CategoryNotFoundError } from '../errors/category.errors.js';
import type { CategoryRepository } from '../../domain/ports/category.repository.js';

export class ActivateCategoryUseCase {
	constructor(private readonly categoryRepository: CategoryRepository) {}

	async execute(id: string) {
		const category = await this.categoryRepository.findById(id);
		if (!category) {
			throw new CategoryNotFoundError('La categoría no existe');
		}
		if (category.active) {
			return category;
		}
		const result = await this.categoryRepository.update(category.activate());
		if (!result) {
			throw new CategoryNotFoundError('La categoría dejó de existir durante la activación');
		}
		return result;
	}
}
