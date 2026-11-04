import { AuthenticationError } from '../errors/authentication.error.js';
import { UserEntity } from '../../domain/entities/user-entity.js';
import type { AuthenticationRepository } from '../../domain/ports/repositories/authentication.repository.js';
import type { PasswordHasher } from '../../domain/ports/security/password-hasher.js';

export interface ActivateAccountInput {
	email: string;
	password: string;
}

const institutionalEmailPattern =
	/^[a-zA-Z0-9._%+-]+@correounivalle\.edu\.co$/i;

export class ActivateAccountUseCase {
	constructor(
		private readonly authenticationRepository: AuthenticationRepository,
		private readonly passwordHasher: PasswordHasher,
	) {}

	async execute(input: ActivateAccountInput): Promise<UserEntity> {
		if (
			!input ||
			typeof input.email !== 'string' ||
			typeof input.password !== 'string' ||
			input.password.length < 8
		) {
			throw new AuthenticationError(
				'El correo y una contraseña de al menos 8 caracteres son obligatorios',
				400,
			);
		}

		const email = input.email.trim().toLowerCase();
		if (!institutionalEmailPattern.test(email)) {
			throw new AuthenticationError(
				'Usa un correo @correounivalle.edu.co',
				400,
			);
		}

		const authorizedEmail =
			await this.authenticationRepository.findAuthorizedEmail(email);
		if (!authorizedEmail?.active) {
			throw new AuthenticationError(
				'El correo no está autorizado para activar una cuenta',
				403,
			);
		}

		if (await this.authenticationRepository.findUserByEmail(email)) {
			throw new AuthenticationError('La cuenta ya fue activada', 409);
		}

		const passwordHash = await this.passwordHasher.hash(input.password);
		const user = UserEntity.create(
			authorizedEmail.name,
			email,
			passwordHash,
			authorizedEmail.role,
		);

		return this.authenticationRepository.save(user);
	}
}