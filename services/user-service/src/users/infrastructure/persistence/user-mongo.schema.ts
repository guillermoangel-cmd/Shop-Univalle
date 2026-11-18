import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { USER_ROLES, type UserRole, type UserState } from '../../domain/entities/user-entity.js';

@Schema({ collection: 'usuarios', timestamps: true })
export class UserMongoDocument {
	@Prop({ required: true, trim: true })
	nombre!: string;

	@Prop({ required: true, unique: true, lowercase: true, trim: true })
	email!: string;

	@Prop({ required: true })
	passwordHash!: string;

	@Prop({ required: true, enum: USER_ROLES })
	rol!: UserRole;

	@Prop({ required: true, enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' })
	estado!: UserState;

	@Prop({ required: true, default: true })
	emailVerified!: boolean;

	@Prop({ type: [Object], default: [] })
	addresses!: CustomerAddress[];

	@Prop({ type: String, default: null })
	selectedAddressId!: string | null;
}

export const UserMongoSchema = SchemaFactory.createForClass(UserMongoDocument);

export interface CustomerAddress {
	id: string;
	label: string;
	address: string;
	details: string;
}

@Schema({ collection: 'perfiles', timestamps: true })
export class ProfileMongoDocument {
	@Prop({ required: true, unique: true, trim: true, index: true })
	userId!: string;

	@Prop({ required: true, trim: true, maxlength: 60 })
	nickname!: string;

	@Prop({ default: '', trim: true, maxlength: 240 })
	address!: string;

	@Prop({ default: '' })
	imageUrl!: string;

	@Prop({ required: true, min: 0, default: 0 })
	shippingCost!: number;

	@Prop({ required: true, default: true, index: true })
	active!: boolean;
}

export const ProfileMongoSchema = SchemaFactory.createForClass(ProfileMongoDocument);

@Schema({ collection: 'correos_institucionales', timestamps: true })
export class AuthorizedEmailMongoDocument {
	@Prop({ required: true, unique: true, lowercase: true, trim: true })
	email!: string;

	@Prop({ required: true, trim: true })
	nombre!: string;

	@Prop({ required: true, trim: true })
	apellido!: string;

	@Prop({ required: true, enum: USER_ROLES })
	rol!: UserRole;

	@Prop({ required: true, default: true })
	authorized!: boolean;
}

export const AuthorizedEmailMongoSchema = SchemaFactory.createForClass(
	AuthorizedEmailMongoDocument,
);