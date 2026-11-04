import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ScryptPasswordHasherAdapter {
	async hash(password: string): Promise<string> {
		const salt = randomBytes(16);
		const derivedKey = await new Promise<Buffer>((resolve, reject) => {
			scryptCallback(password, salt, 64, (error, key) => {
				if (error) {
					reject(error);
					return;
				}
				resolve(key);
			});
		});

		return `scrypt:${salt.toString('hex')}:${derivedKey.toString('hex')}`;
	}
}