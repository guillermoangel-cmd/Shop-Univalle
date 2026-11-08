import {
	ProductEntity,
	type ProductData,
} from '../../domain/entities/product.entity.js';
import type { ProductRepository } from '../../domain/ports/product.repository.js';
import type { CategoryRepository } from '../../domain/ports/category.repository.js';
import { CategoryNotFoundError } from '../errors/category.errors.js';

export class CreateProductUseCase {
	constructor(
		private readonly productRepository: ProductRepository,
		private readonly categoryRepository: CategoryRepository,
	) {}

	async execute(input: ProductData): Promise<ProductEntity> {
		if (!input || typeof input.categoryId !== 'string' || !input.categoryId.trim()) {
			throw new CategoryNotFoundError('Selecciona una categoría válida');
		}
		const category = await this.categoryRepository.findById(input.categoryId);
		if (!category || !category.active) {
			throw new CategoryNotFoundError('La categoría seleccionada no existe o está inactiva');
		}
		const product = ProductEntity.create({ ...input, category: category.name });
		return this.productRepository.save(product);
	}
}