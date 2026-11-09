export interface CategoryData {
	name: string;
	description?: string;
	profileId?: string;
}

export class InvalidCategoryError extends Error {}

export class CategoryEntity {
	constructor(
		public readonly id: string | null,
		public readonly name: string,
		public readonly description: string,
		public readonly active: boolean,
		public readonly profileId: string | null = null,
	) {}

	static create(data: CategoryData): CategoryEntity {
		if (!data || typeof data.name !== 'string') {
			throw new InvalidCategoryError('El nombre de la categoría es obligatorio');
		}

		const name = data.name.trim();
		if (!name || name.length > 80) {
			throw new InvalidCategoryError('El nombre debe tener entre 1 y 80 caracteres');
		}

		if (data.description !== undefined && typeof data.description !== 'string') {
			throw new InvalidCategoryError('La descripción no es válida');
		}

		const description = data.description?.trim() ?? '';
		if (description.length > 240) {
			throw new InvalidCategoryError('La descripción no puede superar 240 caracteres');
		}

		return new CategoryEntity(
			null,
			name,
			description,
			true,
			typeof data.profileId === 'string' ? data.profileId.trim() || null : null,
		);
	}

	update(data: Partial<CategoryData>): CategoryEntity {
		if (!data || typeof data !== 'object') {
			throw new InvalidCategoryError('Los datos de la categoría no son válidos');
		}
		if (
			('name' in data && typeof data.name !== 'string') ||
			('description' in data && typeof data.description !== 'string')
		) {
			throw new InvalidCategoryError('Los datos de la categoría no son válidos');
		}
		const updated = CategoryEntity.create({
			name: data.name ?? this.name,
			description: data.description ?? this.description,
		});
		return new CategoryEntity(
			this.id,
			updated.name,
			updated.description,
			this.active,
			this.profileId,
		);
	}

	deactivate(): CategoryEntity {
		return new CategoryEntity(this.id, this.name, this.description, false, this.profileId);
	}

	activate(): CategoryEntity {
		return new CategoryEntity(this.id, this.name, this.description, true, this.profileId);
	}
}
