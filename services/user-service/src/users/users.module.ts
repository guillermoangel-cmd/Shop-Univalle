import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivateAccountUseCase } from './application/use-cases/activate-account.use-case.js';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { AUTHENTICATION_REPOSITORY, type AuthenticationRepository } from './domain/ports/repositories/authentication.repository.js';
import { USER_REPOSITORY, type UserRepository } from './domain/ports/repositories/user.repository.js';
import { PASSWORD_HASHER, type PasswordHasher } from './domain/ports/security/password-hasher.js';
import { PASSWORD_VERIFIER, type PasswordVerifier } from './domain/ports/security/password-verifier.js';
import { TOKEN_SIGNER, type TokenSigner } from './domain/ports/security/token-signer.js';
import {
	UNIVERSITY_MEMBERSHIP_VERIFIER,
	type UniversityMembershipVerifier,
} from './domain/ports/security/university-membership-verifier.js';
import { BcryptPasswordAdapter } from './infrastructure/adapters/bcrypt-password.adapter.js';
import { EnvironmentUniversityMembershipVerifier } from './infrastructure/adapters/environment-university-membership-verifier.adapter.js';
import { JwtTokenSignerAdapter } from './infrastructure/adapters/jwt-token-signer.adapter.js';
import { UserRepositoryAdapter } from './infrastructure/adapters/user-mongo-repository.adapter.js';
import {
	AuthorizedEmailMongoDocument,
	AuthorizedEmailMongoSchema,
	ProfileMongoDocument,
	ProfileMongoSchema,
	UserMongoDocument,
	UserMongoSchema,
} from './infrastructure/persistence/user-mongo.schema.js';
import { AuthController } from './infrastructure/http/auth.controller.js';
import { CreateUserController } from './infrastructure/http/create-user.controller.js';
import { CustomerAddressesController } from './infrastructure/http/customer-addresses.controller.js';
import { ProfilesController } from './infrastructure/http/profiles.controller.js';
import {
	AdministrativeGuard,
	UserAuthGuard,
} from './infrastructure/http/user-auth.guard.js';

@Module({
	imports: [
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				secret:
					config.get<string>('JWT_SECRET') ??
					'univalle-shop-dev-jwt-secret-2026',
				signOptions: { expiresIn: '24h' },
			}),
		}),
		MongooseModule.forFeature([
			{ name: UserMongoDocument.name, schema: UserMongoSchema },
			{
				name: AuthorizedEmailMongoDocument.name,
				schema: AuthorizedEmailMongoSchema,
			},
			{ name: ProfileMongoDocument.name, schema: ProfileMongoSchema },
		]),
	],
	controllers: [
		AuthController,
		CreateUserController,
		ProfilesController,
		CustomerAddressesController,
	],
	providers: [
		UserRepositoryAdapter,
		UserAuthGuard,
		AdministrativeGuard,
		BcryptPasswordAdapter,
		JwtTokenSignerAdapter,
		EnvironmentUniversityMembershipVerifier,
		{
			provide: AUTHENTICATION_REPOSITORY,
			useExisting: UserRepositoryAdapter,
		},
		{
			provide: USER_REPOSITORY,
			useExisting: UserRepositoryAdapter,
		},
		{ provide: PASSWORD_HASHER, useExisting: BcryptPasswordAdapter },
		{
			provide: PASSWORD_VERIFIER,
			useExisting: BcryptPasswordAdapter,
		},
		{
			provide: TOKEN_SIGNER,
			useExisting: JwtTokenSignerAdapter,
		},
		{
			provide: UNIVERSITY_MEMBERSHIP_VERIFIER,
			useExisting: EnvironmentUniversityMembershipVerifier,
		},
		{
			provide: CreateUserUseCase,
			useFactory: (
				repository: UserRepository,
				passwordHasher: PasswordHasher,
				membershipVerifier: UniversityMembershipVerifier,
			) => new CreateUserUseCase(
				repository,
				passwordHasher,
				membershipVerifier,
			),
			inject: [
				USER_REPOSITORY,
				PASSWORD_HASHER,
				UNIVERSITY_MEMBERSHIP_VERIFIER,
			],
		},
		{
			provide: ActivateAccountUseCase,
			useFactory: (
				repository: AuthenticationRepository,
				passwordHasher: PasswordHasher,
			) => new ActivateAccountUseCase(repository, passwordHasher),
			inject: [AUTHENTICATION_REPOSITORY, PASSWORD_HASHER],
		},
		{
			provide: LoginUseCase,
			useFactory: (
				repository: AuthenticationRepository,
				passwordVerifier: PasswordVerifier,
				tokenSigner: TokenSigner,
			) => new LoginUseCase(repository, passwordVerifier, tokenSigner),
			inject: [
				AUTHENTICATION_REPOSITORY,
				PASSWORD_VERIFIER,
				TOKEN_SIGNER,
			],
		},
	],
	exports: [ActivateAccountUseCase, CreateUserUseCase, LoginUseCase],
})
export class UsersModule {}