import type { ProductEntity } from '../../domain/entities/product.entity.js';
import type { ProductRepository } from '../../domain/ports/product.repository.js';

export class ListProductsUseCase {
	constructor(private readonly productRepository: ProductRepository) {}

	execute(): Promise<ProductEntity[]> {
		return this.productRepository.findAll();
	}
}