import { jest } from '@jest/globals';
import { UserDomainError, UserEntity } from '../../domain/entities/user-entity.js';
import type { UserRepository } from '../../domain/ports/repositories/user.repository.js';
import type { PasswordHasher } from '../../domain/ports/security/password-hasher.js';
import type { UniversityMembershipVerifier } from '../../domain/ports/security/university-membership-verifier.js';
import { CreateUserUseCase } from './create-user.use-case.js';

describe('CreateUserUseCase', () => {
	const savedUsers: UserEntity[] = [];
	const repository: UserRepository = {
		save: jest.fn(async (user) => {
			savedUsers.push(user);
			return user;
		}),
	};
	const passwordHasher: PasswordHasher = {
		hash: jest.fn(async () => 'scrypt:hashed-password'),
	};
	const membershipVerifier: UniversityMembershipVerifier = {
		isUniversityEmail: jest.fn(async () => true),
	};
	const useCase = new CreateUserUseCase(
		repository,
		passwordHasher,
		membershipVerifier,
	);

	beforeEach(() => {
		savedUsers.length = 0;
		jest.clearAllMocks();
	});

	it('verifies the institutional email and stores only a password hash', async () => {
		const user = await useCase.execute({
			name: 'Ana',
			email: 'ana@univalle.edu',
			password: 'a-long-password',
		});

		expect(membershipVerifier.isUniversityEmail).toHaveBeenCalledWith(
			'ana@univalle.edu',
		);
		expect(passwordHasher.hash).toHaveBeenCalledWith('a-long-password');
		expect(savedUsers[0].passwordHash).toBe('scrypt:hashed-password');
		expect(user.email).toBe('ana@univalle.edu');
	});

	it('rejects unconfigured university emails before hashing', async () => {
		jest.mocked(membershipVerifier.isUniversityEmail).mockResolvedValue(false);

		await expect(
			useCase.execute({
				name: 'Ana',
				email: 'ana@univalle.edu',
				password: 'a-long-password',
			}),
		).rejects.toThrow(UserDomainError);
		expect(passwordHasher.hash).not.toHaveBeenCalled();
	});
});