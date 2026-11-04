import {
	Body,
	ConflictException,
	Controller,
	HttpException,
	Post,
} from '@nestjs/common';
import { AuthenticationError } from '../../application/errors/authentication.error.js';
import {
	ActivateAccountUseCase,
	type ActivateAccountInput,
} from '../../application/use-cases/activate-account.use-case.js';
import {
	LoginUseCase,
	type LoginInput,
} from '../../application/use-cases/login.use-case.js';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly activateAccount: ActivateAccountUseCase,
		private readonly loginUseCase: LoginUseCase,
	) {}

	@Post('activate')
	async activate(@Body() input: ActivateAccountInput) {
		try {
			const user = await this.activateAccount.execute(input);
			return {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				state: user.state,
				emailVerified: user.emailVerified,
			};
		} catch (error) {
			this.handleError(error);
		}
	}

	@Post('login')
	async login(@Body() input: LoginInput) {
		try {
			return await this.loginUseCase.execute(input);
		} catch (error) {
			this.handleError(error);
		}
	}

	private handleError(error: unknown): never {
		if (error instanceof AuthenticationError) {
			throw new HttpException(error.message, error.statusCode);
		}
		if (
			typeof error === 'object' &&
			error !== null &&
			'code' in error &&
			error.code === 11000
		) {
			throw new ConflictException('La cuenta ya fue activada');
		}
		throw error;
	}
}