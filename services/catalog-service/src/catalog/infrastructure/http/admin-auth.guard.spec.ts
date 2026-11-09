import { describe, expect, it } from '@jest/globals';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import type { ExecutionContext } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard.js';

const secret = 'test-secret-for-catalog-guard';

function createToken(role: string, expiresAt: number): string {
	const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
	const payload = Buffer.from(JSON.stringify({
		sub: 'user-id',
		email: 'admin@correounivalle.edu.co',
		role,
		exp: expiresAt,
	})).toString('base64url');
	const content = `${header}.${payload}`;
	const signature = createHmac('sha256', secret).update(content).digest('base64url');
	return `${content}.${signature}`;
}

function contextFor(token?: string): ExecutionContext {
	const request = {
		headers: token ? { authorization: `Bearer ${token}` } : {},
	};
	return {
		switchToHttp: () => ({ getRequest: () => request }),
	} as unknown as ExecutionContext;
}

describe('AdminAuthGuard', () => {
	it('allows a valid administrative token', () => {
		process.env.JWT_SECRET = secret;
		const guard = new AdminAuthGuard();
		const token = createToken('ADMINISTRATIVO', Date.now() / 1000 + 60);

		expect(guard.canActivate(contextFor(token))).toBe(true);
	});

	it('rejects missing, expired, and non-administrator tokens', () => {
		process.env.JWT_SECRET = secret;
		const guard = new AdminAuthGuard();

		expect(() => guard.canActivate(contextFor())).toThrow(UnauthorizedException);
		expect(() => guard.canActivate(contextFor(
			createToken('ADMINISTRATIVO', Date.now() / 1000 - 60),
		))).toThrow(UnauthorizedException);
		expect(() => guard.canActivate(contextFor(
			createToken('ESTUDIANTE', Date.now() / 1000 + 60),
		))).toThrow(ForbiddenException);
	});
});
