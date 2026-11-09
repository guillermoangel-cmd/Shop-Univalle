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

  async findAll(profileId?: string, includeInactive = false): Promise<ProductEntity[]> {
    if (!this.isMongoConnected()) {
      const products = Array.from(this.memoryProducts.values());
      return products.filter((product) =>
        (!profileId || product.profileId === profileId) &&
        (includeInactive || product.active),
      );
    }

    try {
      const filter = {
        ...(profileId ? { profileId } : {}),
        ...(!includeInactive ? { active: true } : {}),
      };
      const records = await this.productModel.find(filter).sort({ name: 1 }).exec();
      if (records.length === 0) {
        return [];
      }
      return records.map((record) => this.toEntity(record));
    } catch {
      return [];
    }
  }

  async findById(id: string): Promise<ProductEntity | null> {
    if (!this.isMongoConnected()) {
      const product = this.memoryProducts.get(id);
      return product?.active ? product : null;
    }

    if (!Types.ObjectId.isValid(id)) {
      const product = this.memoryProducts.get(id);
      return product?.active ? product : null;
    }

    try {
      const record = await this.productModel.findOne({ _id: id, active: true }).exec();
      const fallback = this.memoryProducts.get(id);
      return record ? this.toEntity(record) : (fallback?.active ? fallback : null);
    } catch {
      const product = this.memoryProducts.get(id);
      return product?.active ? product : null;
    }
  }

  async findByCategoryId(id: string, profileId?: string): Promise<number> {
    if (!this.isMongoConnected()) {
      return Array.from(this.memoryProducts.values()).filter(
        (p) => p.categoryId === id && (!profileId || p.profileId === profileId),
      ).length;
    }
    try {
      return await this.productModel.countDocuments({
        categoryId: id,
        ...(profileId ? { profileId } : {}),
      }).exec();
    } catch {
      return 0;
    }
  }

  async updateCategoryName(categoryId: string, name: string, profileId?: string): Promise<void> {
    for (const [key, p] of this.memoryProducts.entries()) {
      if (p.categoryId === categoryId && (!profileId || p.profileId === profileId)) {
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
            p.profileId,
            p.active,
          ),
        );
      }
    }

    if (this.isMongoConnected()) {
      try {
        await this.productModel
          .updateMany(
            { categoryId, ...(profileId ? { profileId } : {}) },
            { $set: { category: name } },
          )
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
        product.profileId,
        product.active,
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
      profileId: product.profileId ?? '',
      active: product.active,
    });

    return this.toEntity(record);
  }

  async setActive(id: string, active: boolean): Promise<ProductEntity | null> {
    if (!this.isMongoConnected()) {
      const product = this.memoryProducts.get(id);
      if (!product) return null;
      const updated = new ProductEntity(
        product.id,
        product.name,
        product.description,
        product.imageUrl,
        product.category,
        product.price,
        product.stock,
        product.categoryId,
        product.profileId,
        active,
      );
      this.memoryProducts.set(id, updated);
      return updated;
    }
    if (!Types.ObjectId.isValid(id)) return null;
    const record = await this.productModel
      .findByIdAndUpdate(id, { $set: { active } }, { new: true, runValidators: true })
      .exec();
    return record ? this.toEntity(record) : null;
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
      record.profileId ?? null,
      record.active ?? true,
    );
  }
}
