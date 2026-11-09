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
	ProfileMongoDocument,
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
		@InjectModel(ProfileMongoDocument.name)
		private readonly profileModel: Model<ProfileMongoDocument>,
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
			role: String(record.rol) === 'ADMINISTRADOR'
				? 'ADMINISTRATIVO'
				: record.rol,
			active: record.authorized,
		};
	}

	async findUserByEmail(email: string): Promise<UserEntity | null> {
		const record = await this.userModel.findOne({ email }).exec();
		if (!record) return null;
		await this.profileModel.updateOne(
			{ userId: String(record._id) },
			{
				$setOnInsert: {
					nickname: record.nombre,
					address: '',
					shippingCost: 0,
					active: true,
				},
			},
			{ upsert: true },
		).exec();
		return this.toEntity(record);
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
		try {
			await this.profileModel.create({
				userId: String(record._id),
				nickname: user.name,
				address: '',
				shippingCost: 0,
				active: true,
			});
		} catch (error) {
			await this.userModel.deleteOne({ _id: record._id }).exec();
			throw error;
		}

		return this.toEntity(record);
	}

	private toEntity(record: HydratedDocument<UserMongoDocument>): UserEntity {
		return new UserEntity(
			String(record._id),
			record.nombre,
			record.email,
			record.passwordHash,
			String(record.rol) === 'ADMINISTRADOR'
				? 'ADMINISTRATIVO'
				: record.rol,
			record.estado,
			record.emailVerified,
		);
	}
}
