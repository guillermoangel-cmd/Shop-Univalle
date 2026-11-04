import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';

@Injectable()
export class BcryptPasswordAdapter {
	private readonly saltRounds = 12;

	hash(password: string): Promise<string> {
		return bcrypt.hash(password, this.saltRounds);
	}

	verify(password: string, passwordHash: string): Promise<boolean> {
		return bcrypt.compare(password, passwordHash);
	}
}