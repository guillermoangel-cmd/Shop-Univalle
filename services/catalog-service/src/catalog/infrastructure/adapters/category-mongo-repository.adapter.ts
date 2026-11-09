import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type HydratedDocument, type Model } from 'mongoose';
import { CategoryEntity } from '../../domain/entities/category.entity.js';
import type { CategoryRepository } from '../../domain/ports/category.repository.js';
import { CategoryMongoDocument } from '../persistence/category-mongo.schema.js';

@Injectable()
export class CategoryMongoRepositoryAdapter implements CategoryRepository {
	constructor(
		@InjectModel(CategoryMongoDocument.name)
		private readonly categoryModel: Model<CategoryMongoDocument>,
	) {}

	async findAll(includeInactive = false, profileId?: string): Promise<CategoryEntity[]> {
		const filter = {
			...(includeInactive ? {} : { active: true }),
			...(profileId ? { profileId } : {}),
		};
		const records = await this.categoryModel.find(filter).sort({ name: 1 }).exec();
		return records.map((record) => this.toEntity(record));
	}

	async findById(id: string, profileId?: string): Promise<CategoryEntity | null> {
		if (!Types.ObjectId.isValid(id)) {
			return null;
		}
		const record = await this.categoryModel.findOne({
			_id: id,
			...(profileId ? { profileId } : {}),
		}).exec();
		return record ? this.toEntity(record) : null;
	}

	async findByName(name: string, profileId?: string): Promise<CategoryEntity | null> {
		const record = await this.categoryModel.findOne({
			nameKey: name.trim().toLocaleLowerCase('es'),
			...(profileId ? { profileId } : {}),
		}).exec();
		return record ? this.toEntity(record) : null;
	}

	async save(category: CategoryEntity): Promise<CategoryEntity> {
		const record = await this.categoryModel.create({
			name: category.name,
			nameKey: category.name.toLocaleLowerCase('es'),
			description: category.description,
			active: category.active,
			profileId: category.profileId ?? '',
		});
		return this.toEntity(record);
	}

	async update(category: CategoryEntity): Promise<CategoryEntity | null> {
		if (!category.id || !Types.ObjectId.isValid(category.id)) {
			throw new Error('Identificador de categoría inválido');
		}
		const record = await this.categoryModel.findByIdAndUpdate(
			category.id,
			{
				name: category.name,
				nameKey: category.name.toLocaleLowerCase('es'),
				description: category.description,
				active: category.active,
				profileId: category.profileId,
			},
			{ new: true, runValidators: true },
		).exec();
		if (!record) {
			return null;
		}
		return this.toEntity(record);
	}

	private toEntity(record: HydratedDocument<CategoryMongoDocument>): CategoryEntity {
		return new CategoryEntity(
			String(record._id),
			record.name,
			record.description,
			record.active,
			record.profileId ?? null,
		);
	}
}
