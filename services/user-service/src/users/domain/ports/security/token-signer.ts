import type { UserEntity } from '../../entities/user-entity.js';

export const TOKEN_SIGNER = Symbol('TOKEN_SIGNER');

export interface TokenSigner {
	sign(user: UserEntity): Promise<string>;
}