import { UserEntity } from '../../domain/entities/user-entity.js';
import { UserRepository } from '../../domain/ports/repositories/user.repository.js';

export interface CreateUserInput {
    name: string;
    email: string;
    passwordHash: string;
}

export class CreateUserUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    execute(input: CreateUserInput): Promise<UserEntity> {
        const user = UserEntity.create(
            input.name,
            input.email,
            input.passwordHash,
        );

        return this.userRepository.save(user);
    }
}