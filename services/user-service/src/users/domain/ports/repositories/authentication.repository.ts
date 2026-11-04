import type { UserEntity, UserRole } from '../../entities/user-entity.js';

export const AUTHENTICATION_REPOSITORY = Symbol(
	'AUTHENTICATION_REPOSITORY',
);

export interface AuthorizedInstitutionalEmail {
	email: string;
	name: string;
	role: UserRole;
	active: boolean;
}

export interface AuthenticationRepository {
	findAuthorizedEmail(email: string): Promise<AuthorizedInstitutionalEmail | null>;
	findUserByEmail(email: string): Promise<UserEntity | null>;
	save(user: UserEntity): Promise<UserEntity>;
}