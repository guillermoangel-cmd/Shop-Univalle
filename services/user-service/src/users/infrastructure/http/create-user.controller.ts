import {
	BadRequestException,
	Body,
	ConflictException,
	Controller,
	Post,
} from '@nestjs/common';
import {
	CreateUserUseCase,
	type CreateUserInput,
} from '../../application/use-cases/create-user.use-case.js';
import { UserDomainError } from '../../domain/entities/user-entity.js';

@Controller('users')
export class CreateUserController {
	constructor(private readonly createUser: CreateUserUseCase) {}

	@Post()
	async create(@Body() input: CreateUserInput) {
		try {
			const user = await this.createUser.execute(input);
			return { id: user.id, name: user.name, email: user.email };
		} catch (error) {
			if (error instanceof UserDomainError) {
				throw new BadRequestException(error.message);
			}
			if (
				error instanceof Error &&
				'code' in error &&
				error.code === 11000
			) {
				throw new ConflictException('Este correo ya está registrado');
			}
			throw error;
		}
	}
}