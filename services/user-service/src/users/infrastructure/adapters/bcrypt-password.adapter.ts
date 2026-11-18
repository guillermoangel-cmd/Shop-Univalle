import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../../domain/ports/security/password-hasher.js';
import type { PasswordVerifier } from '../../domain/ports/security/password-verifier.js';

@Injectable()
export class BcryptPasswordAdapter implements PasswordHasher, PasswordVerifier {
	private readonly saltRounds = 12;

	hash(password: string): Promise<string> {
		return bcrypt.hash(password, this.saltRounds);
	}

	verify(password: string, passwordHash: string): Promise<boolean> {
		return bcrypt.compare(password, passwordHash);
	}
}