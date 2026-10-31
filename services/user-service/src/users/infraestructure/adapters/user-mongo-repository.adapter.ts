import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { UserEntity } from '../../domain/entities/user-entity.js';
import { UserRepository } from '../../domain/ports/repositories/user.repository.js';
import { UserMongoDocument } from '../persistence/user-mongo.schema.js';

@Injectable()
export class UserRepositoryAdapter implements UserRepository {
	constructor(
		@InjectModel(UserMongoDocument.name)
		private readonly userModel: Model<UserMongoDocument>,
	) {}

	async save(user: UserEntity): Promise<UserEntity> {
		const record = await this.userModel.create({
			name: user.name,
			email: user.email,
			passwordHash: user.passwordHash,
		});

		return new UserEntity(
			String(record._id),
			record.name,
			record.email,
			record.passwordHash,
		);
	}
}
