import { CategoryEntity, InvalidCategoryError } from './category.entity.js';

describe('CategoryEntity', () => {
	it('normalizes a valid category', () => {
		const category = CategoryEntity.create({
			name: '  Bebidas ',
			description: '  Bebidas frías  ',
		});

		expect(category.name).toBe('Bebidas');
		expect(category.description).toBe('Bebidas frías');
		expect(category.active).toBe(true);
	});

	it('rejects empty names and excessive descriptions', () => {
		expect(() => CategoryEntity.create({ name: '  ' })).toThrow(
			InvalidCategoryError,
		);
		expect(() => CategoryEntity.create({
			name: 'Bebidas',
			description: 'x'.repeat(241),
		})).toThrow(InvalidCategoryError);
	});
});
