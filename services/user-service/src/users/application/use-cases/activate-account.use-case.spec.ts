import { jest } from '@jest/globals';
import { AuthenticationError } from '../errors/authentication.error.js';
import type { AuthenticationRepository } from '../../domain/ports/repositories/authentication.repository.js';
import type { PasswordHasher } from '../../domain/ports/security/password-hasher.js';
import { ActivateAccountUseCase } from './activate-account.use-case.js';

describe('ActivateAccountUseCase', () => {
	const repository: AuthenticationRepository = {
		findAuthorizedEmail: jest.fn(async () => ({
			email: 'estudiante.demo@correounivalle.edu.co',
			name: 'Estudiante Demo',
			role: 'ESTUDIANTE',
			active: true,
		})),
		findUserByEmail: jest.fn(async () => null),
		save: jest.fn(async (user) => user),
	};
	const passwordHasher: PasswordHasher = {
		hash: jest.fn(async () => '$2b$12$hashed'),
	};
	const useCase = new ActivateAccountUseCase(repository, passwordHasher);

	beforeEach(() => jest.clearAllMocks());

	it('takes the name and role from the authorized email record', async () => {
		const user = await useCase.execute({
			email: 'ESTUDIANTE.DEMO@CORREOUNIVALLE.EDU.CO',
			password: 'Clave123',
		});

		expect(user.name).toBe('Estudiante Demo');
		expect(user.role).toBe('ESTUDIANTE');
		expect(user.passwordHash).toBe('$2b$12$hashed');
		expect(repository.save).toHaveBeenCalledTimes(1);
	});

	it('rejects passwords shorter than eight characters', async () => {
		await expect(
			useCase.execute({
				email: 'estudiante.demo@correounivalle.edu.co',
				password: 'Clave12',
			}),
		).rejects.toThrow(AuthenticationError);
		expect(repository.findAuthorizedEmail).not.toHaveBeenCalled();
	});

	it('rejects emails that are not pre-authorized', async () => {
		jest.mocked(repository.findAuthorizedEmail).mockResolvedValue(null);

		await expect(
			useCase.execute({
				email: 'unknown@correounivalle.edu.co',
				password: 'password-demo-123',
			}),
		).rejects.toThrow(AuthenticationError);
		expect(passwordHasher.hash).not.toHaveBeenCalled();
	});

	it('rejects a second activation for an existing account', async () => {
		jest.mocked(repository.findUserByEmail).mockResolvedValue({
			id: 'existing-id',
			name: 'Estudiante Demo',
			email: 'estudiante.demo@correounivalle.edu.co',
			passwordHash: 'stored-hash',
			role: 'ESTUDIANTE',
			state: 'ACTIVO',
			emailVerified: true,
		});

		await expect(
			useCase.execute({
				email: 'estudiante.demo@correounivalle.edu.co',
				password: 'password-demo-123',
			}),
		).rejects.toThrow(AuthenticationError);
	});
});