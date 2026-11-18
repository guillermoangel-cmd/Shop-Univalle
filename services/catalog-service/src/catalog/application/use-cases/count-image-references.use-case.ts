import type { ProductRepository } from '../../domain/ports/product.repository.js';

export class CountImageReferencesUseCase {
	constructor(private readonly productRepository: ProductRepository) {}

	async execute(imageUrl: string, excludeId?: string): Promise<number> {
		return this.productRepository.countImageReferences(imageUrl, excludeId);
	}
}
