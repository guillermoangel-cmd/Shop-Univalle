import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivateAccountUseCase } from './application/use-cases/activate-account.use-case.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { AUTHENTICATION_REPOSITORY, type AuthenticationRepository } from './domain/ports/repositories/authentication.repository.js';
import { PASSWORD_HASHER } from './domain/ports/security/password-hasher.js';
import { PASSWORD_VERIFIER } from './domain/ports/security/password-verifier.js';
import { TOKEN_SIGNER } from './domain/ports/security/token-signer.js';
import { BcryptPasswordAdapter } from './infraestructure/adapters/bcrypt-password.adapter.js';
import { JwtTokenSignerAdapter } from './infraestructure/adapters/jwt-token-signer.adapter.js';
import { UserRepositoryAdapter } from './infraestructure/adapters/user-mongo-repository.adapter.js';
import {
	AuthorizedEmailMongoDocument,
	AuthorizedEmailMongoSchema,
	UserMongoDocument,
	UserMongoSchema,
} from './infraestructure/persistence/user-mongo.schema.js';
import { AuthController } from './infraestructure/http/auth.controller.js';

@Module({
	imports: [
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				secret:
					config.get<string>('JWT_SECRET') ??
					'univalle-shop-dev-jwt-secret-2026',
				signOptions: { expiresIn: '1h' },
			}),
		}),
		MongooseModule.forFeature([
			{ name: UserMongoDocument.name, schema: UserMongoSchema },
			{
				name: AuthorizedEmailMongoDocument.name,
				schema: AuthorizedEmailMongoSchema,
			},
		]),
	],
	controllers: [AuthController],
	providers: [
		UserRepositoryAdapter,
		BcryptPasswordAdapter,
		JwtTokenSignerAdapter,
		{
			provide: AUTHENTICATION_REPOSITORY,
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
			provide: ActivateAccountUseCase,
			useFactory: (
				repository: AuthenticationRepository,
				passwordHasher: BcryptPasswordAdapter,
			) => new ActivateAccountUseCase(repository, passwordHasher),
			inject: [AUTHENTICATION_REPOSITORY, PASSWORD_HASHER],
		},
		{
			provide: LoginUseCase,
			useFactory: (
				repository: AuthenticationRepository,
				passwordVerifier: BcryptPasswordAdapter,
				tokenSigner: JwtTokenSignerAdapter,
			) => new LoginUseCase(repository, passwordVerifier, tokenSigner),
			inject: [
				AUTHENTICATION_REPOSITORY,
				PASSWORD_VERIFIER,
				TOKEN_SIGNER,
			],
		},
	],
	exports: [ActivateAccountUseCase, LoginUseCase],
})
export class UsersModule {}