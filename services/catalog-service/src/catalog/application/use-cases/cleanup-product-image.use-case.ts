import type { ProductRepository } from '../../domain/ports/product.repository.js';

export class CleanupProductImageUseCase {
	constructor(private readonly productRepository: ProductRepository) {}

	async execute(
		productId: string,
		imageUrl: string,
		profileId: string,
	): Promise<boolean | null> {
		const product = await this.productRepository.findById(
			productId,
			profileId,
			true,
		);
		if (!product) return null;
		if (product.imageUrl === imageUrl) return false;

		const references = await this.productRepository.countImageReferences(
			imageUrl,
			productId,
		);
		return references === 0;
	}
}
