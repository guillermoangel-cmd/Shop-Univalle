import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case.js';
import {
	USER_REPOSITORY,
	type UserRepository,
} from './domain/ports/repositories/user.repository.js';
import { UserRepositoryAdapter } from './infraestructure/adapters/user-repository.adapter.js';
import {
	UserMongoDocument,
	UserMongoSchema,
} from './infraestructure/persistence/user-mongo.schema.js';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: UserMongoDocument.name, schema: UserMongoSchema },
		]),
	],
	providers: [
		UserRepositoryAdapter,
		{ provide: USER_REPOSITORY, useExisting: UserRepositoryAdapter },
		{
			provide: CreateUserUseCase,
			useFactory: (userRepository: UserRepository) =>
				new CreateUserUseCase(userRepository),
			inject: [USER_REPOSITORY],
		},
	],
	exports: [CreateUserUseCase],
})
export class UsersModule {}