import { UserEntity } from '../../entities/user-entity.js';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
	save(user: UserEntity): Promise<UserEntity>;
}