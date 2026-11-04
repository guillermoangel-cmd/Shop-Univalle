import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { UserEntity } from '../../domain/entities/user-entity.js';
import type {
	AuthenticationRepository,
	AuthorizedInstitutionalEmail,
} from '../../domain/ports/repositories/authentication.repository.js';
import { UserRepository } from '../../domain/ports/repositories/user.repository.js';
import {
	AuthorizedEmailMongoDocument,
	UserMongoDocument,
} from '../persistence/user-mongo.schema.js';

@Injectable()
export class UserRepositoryAdapter
	implements UserRepository, AuthenticationRepository
{
	constructor(
		@InjectModel(UserMongoDocument.name)
		private readonly userModel: Model<UserMongoDocument>,
		@InjectModel(AuthorizedEmailMongoDocument.name)
		private readonly authorizedEmailModel: Model<AuthorizedEmailMongoDocument>,
	) {}

	async findAuthorizedEmail(
		email: string,
	): Promise<AuthorizedInstitutionalEmail | null> {
		const record = await this.authorizedEmailModel
			.findOne({ email, authorized: true })
			.exec();

		if (!record) {
			return null;
		}

		return {
			email: record.email,
			name: `${record.nombre} ${record.apellido}`.trim(),
			role: record.rol,
			active: record.authorized,
		};
	}

	async findUserByEmail(email: string): Promise<UserEntity | null> {
		const record = await this.userModel.findOne({ email }).exec();
		return record ? this.toEntity(record) : null;
	}

	async save(user: UserEntity): Promise<UserEntity> {
		const record = await this.userModel.create({
			nombre: user.name,
			email: user.email,
			passwordHash: user.passwordHash,
			rol: user.role,
			estado: user.state,
			emailVerified: user.emailVerified,
		});

		return this.toEntity(record);
	}

	private toEntity(record: HydratedDocument<UserMongoDocument>): UserEntity {
		return new UserEntity(
			String(record._id),
			record.nombre,
			record.email,
			record.passwordHash,
			record.rol,
			record.estado,
			record.emailVerified,
		);
	}
}
