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
}

export const UserMongoSchema = SchemaFactory.createForClass(UserMongoDocument);

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