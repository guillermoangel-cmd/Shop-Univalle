import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'users', timestamps: true })
export class UserMongoDocument {
	@Prop({ required: true, trim: true })
	name!: string;

	@Prop({ required: true, unique: true, lowercase: true, trim: true })
	email!: string;

	@Prop({ required: true })
	passwordHash!: string;
}

export const UserMongoSchema = SchemaFactory.createForClass(UserMongoDocument);