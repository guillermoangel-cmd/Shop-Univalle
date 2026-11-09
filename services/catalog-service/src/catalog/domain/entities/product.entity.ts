export interface ProductData {
	name: string;
	description?: string;
	imageUrl?: string;
	category: string;
	categoryId?: string;
	price: number;
	stock: number;
	profileId?: string;
}

export class InvalidProductError extends Error {}

export class ProductEntity {
	constructor(
		public readonly id: string | null,
		public readonly name: string,
		public readonly description: string,
		public readonly imageUrl: string,
		public readonly category: string,
		public readonly price: number,
		public readonly stock: number,
		public readonly categoryId: string | null = null,
		public readonly profileId: string | null = null,
		public readonly active: boolean = true,
	) {}

	static create(data: ProductData): ProductEntity {
		if (
			typeof data?.name !== 'string' ||
			typeof data.category !== 'string'
		) {
			throw new InvalidProductError('Name and category are required');
		}

		const name = data.name.trim();
		const category = data.category.trim();
		if (!name || !category) {
			throw new InvalidProductError('Name and category are required');
		}
		if (!Number.isFinite(data.price) || data.price <= 0) {
			throw new InvalidProductError('Price must be greater than zero');
		}
		if (!Number.isInteger(data.stock) || data.stock < 0) {
			throw new InvalidProductError('Stock must be a non-negative integer');
		}

		return new ProductEntity(
			null,
			name,
			typeof data.description === 'string' ? data.description.trim() : '',
			typeof data.imageUrl === 'string' ? data.imageUrl.trim() : '',
			category,
			data.price,
			data.stock,
			typeof data.categoryId === 'string' ? data.categoryId.trim() || null : null,
			typeof data.profileId === 'string' ? data.profileId.trim() || null : null,
		);
	}
}