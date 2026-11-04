import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'products', timestamps: true })
export class ProductMongoDocument {
	@Prop({ required: true, trim: true })
	name!: string;

	@Prop({ default: '' })
	description!: string;

	@Prop({ default: '' })
	imageUrl!: string;

	@Prop({ required: true, trim: true, index: true })
	category!: string;

	@Prop({ required: true, min: 0 })
	price!: number;

	@Prop({ required: true, min: 0, default: 0 })
	stock!: number;
}

export const ProductMongoSchema =
	SchemaFactory.createForClass(ProductMongoDocument);