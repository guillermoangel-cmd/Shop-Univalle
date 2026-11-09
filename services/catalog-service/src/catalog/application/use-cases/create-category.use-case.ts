import {
	CategoryEntity,
	type CategoryData,
} from '../../domain/entities/category.entity.js';
import type { CategoryRepository } from '../../domain/ports/category.repository.js';
import { CategoryAlreadyExistsError } from '../errors/category.errors.js';

export class CreateCategoryUseCase {
	constructor(private readonly categoryRepository: CategoryRepository) {}

	async execute(input: CategoryData, profileId = input?.profileId): Promise<CategoryEntity> {
		const category = CategoryEntity.create({ ...input, profileId });
		if (await this.categoryRepository.findByName(category.name, profileId)) {
			throw new CategoryAlreadyExistsError('Ya existe una categoría con ese nombre');
		}
		return this.categoryRepository.save(category);
	}
}
