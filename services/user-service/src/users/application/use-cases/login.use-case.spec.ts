import { jest } from '@jest/globals';
import { AuthenticationError } from '../errors/authentication.error.js';
import { UserEntity } from '../../domain/entities/user-entity.js';
import type { AuthenticationRepository } from '../../domain/ports/repositories/authentication.repository.js';
import type { PasswordVerifier } from '../../domain/ports/security/password-verifier.js';
import type { TokenSigner } from '../../domain/ports/security/token-signer.js';
import { LoginUseCase } from './login.use-case.js';

describe('LoginUseCase', () => {
	const user = new UserEntity(
		'user-id',
		'Estudiante Demo',
		'estudiante.demo@correounivalle.edu.co',
		'$2b$12$hashed',
		'ESTUDIANTE',
		'ACTIVO',
		true,
	);
	const repository: AuthenticationRepository = {
		findAuthorizedEmail: jest.fn(async () => null),
		findUserByEmail: jest.fn(async () => user),
		save: jest.fn(async (account) => account),
	};
	const passwordVerifier: PasswordVerifier = {
		verify: jest.fn(async () => true),
	};
	const tokenSigner: TokenSigner = {
		sign: jest.fn(async () => 'signed.jwt.token'),
	};
	const useCase = new LoginUseCase(repository, passwordVerifier, tokenSigner);

	beforeEach(() => jest.clearAllMocks());

	it('verifies the password and returns a signed token with the role', async () => {
		const result = await useCase.execute({
			email: user.email,
			password: 'password-demo-123',
		});

		expect(passwordVerifier.verify).toHaveBeenCalledWith(
			'password-demo-123',
			user.passwordHash,
		);
		expect(tokenSigner.sign).toHaveBeenCalledWith(user);
		expect(result.accessToken).toBe('signed.jwt.token');
		expect(result.user.role).toBe('ESTUDIANTE');
	});

	it('uses a generic error for invalid credentials', async () => {
		jest.mocked(passwordVerifier.verify).mockResolvedValue(false);

		await expect(
			useCase.execute({ email: user.email, password: 'wrong-password' }),
		).rejects.toThrow(AuthenticationError);
		expect(tokenSigner.sign).not.toHaveBeenCalled();
	});
});