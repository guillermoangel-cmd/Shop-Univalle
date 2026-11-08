import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
	Types,
	type HydratedDocument,
	type Model,
} from 'mongoose';
import { ProductEntity } from '../../domain/entities/product.entity.js';
import type { ProductRepository } from '../../domain/ports/product.repository.js';
import { ProductMongoDocument } from '../persistence/product-mongo.schema.js';

@Injectable()
export class ProductMongoRepositoryAdapter implements ProductRepository {
	constructor(
		@InjectModel(ProductMongoDocument.name)
		private readonly productModel: Model<ProductMongoDocument>,
	) {}

	async findAll(): Promise<ProductEntity[]> {
		const records = await this.productModel.find().sort({ name: 1 }).exec();
		return records.map((record) => this.toEntity(record));
	}

	async findById(id: string): Promise<ProductEntity | null> {
		if (!Types.ObjectId.isValid(id)) {
			return null;
		}

		const record = await this.productModel.findById(id).exec();
		return record ? this.toEntity(record) : null;
	}

	findByCategoryId(id: string): Promise<number> {
		return this.productModel.countDocuments({ categoryId: id }).exec();
	}

	async updateCategoryName(categoryId: string, name: string): Promise<void> {
		await this.productModel.updateMany(
			{ categoryId },
			{ $set: { category: name } },
		).exec();
	}

	async save(product: ProductEntity): Promise<ProductEntity> {
		const record = await this.productModel.create({
			name: product.name,
			description: product.description,
			imageUrl: product.imageUrl,
			category: product.category,
			categoryId: product.categoryId,
			price: product.price,
			stock: product.stock,
		});

		return this.toEntity(record);
	}

	private toEntity(
		record: HydratedDocument<ProductMongoDocument>,
	): ProductEntity {
		return new ProductEntity(
			String(record._id),
			record.name,
			record.description,
			record.imageUrl,
			record.category,
			record.price,
			record.stock,
			record.categoryId ?? null,
		);
	}
}