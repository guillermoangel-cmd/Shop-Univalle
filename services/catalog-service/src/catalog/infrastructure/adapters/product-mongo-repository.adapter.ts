import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type HydratedDocument, type Model } from 'mongoose';
import { ProductEntity } from '../../domain/entities/product.entity.js';
import type { ProductRepository } from '../../domain/ports/product.repository.js';
import { ProductMongoDocument } from '../persistence/product-mongo.schema.js';

const DEFAULT_PRODUCTS: ProductEntity[] = [
  new ProductEntity(
    'uv-camiseta-2026',
    'Camiseta Oficial Univalle',
    'Colección 2026 · Talla: M',
    '',
    'ROPA',
    45000,
    25,
    null,
  ),
  new ProductEntity(
    'uv-agenda-2026',
    'Agenda Académica 2026',
    'Material · Talla: Única',
    '',
    'ACADÉMICO',
    28000,
    40,
    null,
  ),
  new ProductEntity(
    'uv-taza-75',
    'Taza Univalle 75 Años',
    'Aniversario · Talla: Única',
    '',
    'ACCESORIOS',
    18000,
    30,
    null,
  ),
  new ProductEntity(
    'uv-maletin-2026',
    'Maletín Universitario',
    'Colección 2026 · Talla: Única',
    '',
    'BOLSOS',
    120000,
    15,
    null,
  ),
];

@Injectable()
export class ProductMongoRepositoryAdapter implements ProductRepository {
  private readonly memoryProducts = new Map<string, ProductEntity>(
    DEFAULT_PRODUCTS.map((p) => [p.id!, p]),
  );

  constructor(
    @InjectModel(ProductMongoDocument.name)
    private readonly productModel: Model<ProductMongoDocument>,
  ) {}

  private isMongoConnected(): boolean {
    return Number(this.productModel?.db?.readyState) === 1;
  }

  async findAll(): Promise<ProductEntity[]> {
    if (!this.isMongoConnected()) {
      return Array.from(this.memoryProducts.values());
    }

    try {
      const records = await this.productModel.find().sort({ name: 1 }).exec();
      if (records.length === 0) {
        return Array.from(this.memoryProducts.values());
      }
      return records.map((record) => this.toEntity(record));
    } catch {
      return Array.from(this.memoryProducts.values());
    }
  }

  async findById(id: string): Promise<ProductEntity | null> {
    if (!this.isMongoConnected()) {
      return this.memoryProducts.get(id) ?? null;
    }

    if (!Types.ObjectId.isValid(id)) {
      return this.memoryProducts.get(id) ?? null;
    }

    try {
      const record = await this.productModel.findById(id).exec();
      return record ? this.toEntity(record) : (this.memoryProducts.get(id) ?? null);
    } catch {
      return this.memoryProducts.get(id) ?? null;
    }
  }

  async findByCategoryId(id: string): Promise<number> {
    if (!this.isMongoConnected()) {
      return Array.from(this.memoryProducts.values()).filter(
        (p) => p.categoryId === id,
      ).length;
    }
    try {
      return await this.productModel.countDocuments({ categoryId: id }).exec();
    } catch {
      return 0;
    }
  }

  async updateCategoryName(categoryId: string, name: string): Promise<void> {
    for (const [key, p] of this.memoryProducts.entries()) {
      if (p.categoryId === categoryId) {
        this.memoryProducts.set(
          key,
          new ProductEntity(
            p.id,
            p.name,
            p.description,
            p.imageUrl,
            name,
            p.price,
            p.stock,
            p.categoryId,
          ),
        );
      }
    }

    if (this.isMongoConnected()) {
      try {
        await this.productModel
          .updateMany({ categoryId }, { $set: { category: name } })
          .exec();
      } catch {
        // ignore
      }
    }
  }

  async save(product: ProductEntity): Promise<ProductEntity> {
    if (!this.isMongoConnected()) {
      const id = product.id ?? `uv-prod-${Date.now()}`;
      const saved = new ProductEntity(
        id,
        product.name,
        product.description,
        product.imageUrl,
        product.category,
        product.price,
        product.stock,
        product.categoryId,
      );
      this.memoryProducts.set(id, saved);
      return saved;
    }

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
