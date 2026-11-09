import type { CategoryRepository } from '../../domain/ports/category.repository.js';

export class ListCategoriesUseCase {
	constructor(private readonly categoryRepository: CategoryRepository) {}

	execute(includeInactive = false, profileId?: string) {
		return this.categoryRepository.findAll(includeInactive, profileId);
	}
}
