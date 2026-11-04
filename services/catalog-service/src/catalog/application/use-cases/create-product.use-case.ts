import {
	ProductEntity,
	type ProductData,
} from '../../domain/entities/product.entity.js';
import type { ProductRepository } from '../../domain/ports/product.repository.js';

export class CreateProductUseCase {
	constructor(private readonly productRepository: ProductRepository) {}

	execute(input: ProductData): Promise<ProductEntity> {
		return this.productRepository.save(ProductEntity.create(input));
	}
}