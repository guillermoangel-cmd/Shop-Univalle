import {
	InvalidProductError,
	ProductEntity,
	type ProductData,
} from './product.entity.js';

describe('ProductEntity', () => {
	const validProduct: ProductData = {
		name: '  Libreta Univalle  ',
		description: ' Papel reciclado ',
		category: ' Papelería ',
		price: 18000,
		stock: 4,
	};

	it('normalizes text and creates an unsaved product', () => {
		const product = ProductEntity.create(validProduct);

		expect(product.id).toBeNull();
		expect(product.name).toBe('Libreta Univalle');
		expect(product.description).toBe('Papel reciclado');
		expect(product.category).toBe('Papelería');
	});

	it('rejects invalid price and stock', () => {
		expect(() => ProductEntity.create({ ...validProduct, price: 0 })).toThrow(
			InvalidProductError,
		);
		expect(() => ProductEntity.create({ ...validProduct, stock: 1.5 })).toThrow(
			InvalidProductError,
		);
	});
});