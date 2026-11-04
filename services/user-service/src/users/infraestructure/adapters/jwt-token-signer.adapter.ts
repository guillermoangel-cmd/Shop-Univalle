import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { UserEntity } from '../../domain/entities/user-entity.js';
import type { TokenSigner } from '../../domain/ports/security/token-signer.js';

@Injectable()
export class JwtTokenSignerAdapter implements TokenSigner {
	constructor(private readonly jwtService: JwtService) {}

	sign(user: UserEntity): Promise<string> {
		return this.jwtService.signAsync({
			sub: user.id,
			email: user.email,
			role: user.role,
		});
	}
}