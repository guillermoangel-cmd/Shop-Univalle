import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'categorias', timestamps: true })
export class CategoryMongoDocument {
	@Prop({ required: true, trim: true })
	name!: string;

	@Prop({ required: true, lowercase: true, trim: true })
	nameKey!: string;

	@Prop({ default: '' })
	description!: string;

	@Prop({ required: true, default: true, index: true })
	active!: boolean;

	@Prop({ required: true, trim: true, index: true })
	profileId!: string;
}

export const CategoryMongoSchema = SchemaFactory.createForClass(CategoryMongoDocument);
CategoryMongoSchema.index({ profileId: 1, nameKey: 1 }, { unique: true });
