import type { ProductRepository } from '../../domain/ports/product.repository.js';

export class SetProductActiveUseCase {
	constructor(private readonly productRepository: ProductRepository) {}

	execute(id: string, active: boolean, profileId?: string) {
		return this.productRepository.setActive(id, active, profileId);
	}
}
