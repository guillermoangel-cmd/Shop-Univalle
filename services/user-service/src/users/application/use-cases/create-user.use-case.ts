import {
    UserDomainError,
    UserEntity,
} from '../../domain/entities/user-entity.js';
import { UserRepository } from '../../domain/ports/repositories/user.repository.js';
import type { PasswordHasher } from '../../domain/ports/security/password-hasher.js';
import type { UniversityMembershipVerifier } from '../../domain/ports/security/university-membership-verifier.js';

export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
}

export class CreateUserUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasher,
        private readonly membershipVerifier: UniversityMembershipVerifier,
    ) {}

    async execute(input: CreateUserInput): Promise<UserEntity> {
        if (
            !input ||
            typeof input.name !== 'string' ||
            typeof input.email !== 'string' ||
            typeof input.password !== 'string' ||
            input.password.length < 8
        ) {
            throw new UserDomainError(
                'El nombre, correo electrónico y contraseña son obligatorios',
            );
        }
        if (!(await this.membershipVerifier.isUniversityEmail(input.email))) {
            throw new UserDomainError(
                'El dominio del correo electrónico debe ser institucional',
            );
        }

        const passwordHash = await this.passwordHasher.hash(input.password);
        const user = UserEntity.create(
            input.name,
            input.email,
            passwordHash,
        );

        return this.userRepository.save(user);
    }
}