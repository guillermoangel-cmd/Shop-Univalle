import { AuthenticationError } from '../errors/authentication.error.js';
import type { AuthenticationRepository } from '../../domain/ports/repositories/authentication.repository.js';
import type { PasswordVerifier } from '../../domain/ports/security/password-verifier.js';
import type { TokenSigner } from '../../domain/ports/security/token-signer.js';

export interface LoginInput {
	email: string;
	password: string;
}

export interface LoginResult {
	accessToken: string;
	tokenType: 'Bearer';
	expiresIn: number;
	user: {
		id: string;
		name: string;
		email: string;
		role: string;
	};
}

export class LoginUseCase {
	constructor(
		private readonly authenticationRepository: AuthenticationRepository,
		private readonly passwordVerifier: PasswordVerifier,
		private readonly tokenSigner: TokenSigner,
	) {}

	async execute(input: LoginInput): Promise<LoginResult> {
		const email = typeof input?.email === 'string'
			? input.email.trim().toLowerCase()
			: '';
		const password = typeof input?.password === 'string' ? input.password : '';
		if (!email.endsWith('@correounivalle.edu.co') || !password) {
			throw new AuthenticationError('Correo o contraseña inválidos', 401);
		}

		const user = await this.authenticationRepository.findUserByEmail(email);
		if (
			!user ||
			user.state !== 'ACTIVO' ||
			!user.emailVerified ||
			!(await this.passwordVerifier.verify(password, user.passwordHash))
		) {
			throw new AuthenticationError('Correo o contraseña inválidos', 401);
		}

		const accessToken = await this.tokenSigner.sign(user);
		return {
			accessToken,
			tokenType: 'Bearer',
			expiresIn: 3600,
			user: {
				id: user.id ?? '',
				name: user.name,
				email: user.email,
				role: user.role,
			},
		};
	}
}