import type { ProductEntity } from '../../domain/entities/product.entity.js';
import type { ProductRepository } from '../../domain/ports/product.repository.js';

export class GetProductUseCase {
	constructor(private readonly productRepository: ProductRepository) {}

	execute(id: string): Promise<ProductEntity | null> {
		return this.productRepository.findById(id);
	}
}