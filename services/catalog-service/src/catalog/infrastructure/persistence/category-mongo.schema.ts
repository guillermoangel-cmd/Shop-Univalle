import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'categorias', timestamps: true })
export class CategoryMongoDocument {
	@Prop({ required: true, trim: true })
	name!: string;

	@Prop({ required: true, unique: true, lowercase: true, trim: true })
	nameKey!: string;

	@Prop({ default: '' })
	description!: string;

	@Prop({ required: true, default: true, index: true })
	active!: boolean;
}

export const CategoryMongoSchema = SchemaFactory.createForClass(CategoryMongoDocument);
