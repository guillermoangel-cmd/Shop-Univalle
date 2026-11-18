import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
	user: {
		sub: string;
		email: string;
		role: string;
	};
}

@Injectable()
export class UserAuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
		const authorization = request.headers.authorization;
		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new Error('JWT_SECRET debe configurarse en el servicio de usuarios');
		}
		if (!authorization?.startsWith('Bearer ')) {
			throw new UnauthorizedException('Se requiere una sesión válida');
		}

		const token = authorization.slice(7);
		const [encodedHeader, encodedPayload, signature, extra] = token.split('.');
		if (!encodedHeader || !encodedPayload || !signature || extra !== undefined) {
			throw new UnauthorizedException('Token inválido');
		}

		try {
			const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8')) as {
				alg?: unknown;
			};
			if (header.alg !== 'HS256') {
				throw new UnauthorizedException('Algoritmo de token no permitido');
			}
			const expected = createHmac('sha256', secret)
				.update(`${encodedHeader}.${encodedPayload}`)
				.digest();
			const actual = Buffer.from(signature, 'base64url');
			if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
				throw new UnauthorizedException('Token inválido');
			}

			const claims = JSON.parse(
				Buffer.from(encodedPayload, 'base64url').toString('utf8'),
			) as Record<string, unknown>;
			if (
				typeof claims.sub !== 'string' ||
				!claims.sub ||
				typeof claims.email !== 'string' ||
				typeof claims.role !== 'string' ||
				typeof claims.exp !== 'number' ||
				claims.exp <= Date.now() / 1000
			) {
				throw new UnauthorizedException('Token inválido o expirado');
			}
			request.user = {
				sub: claims.sub,
				email: claims.email,
				role: claims.role,
			};
			return true;
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			throw new UnauthorizedException('Token inválido');
		}
	}
}

@Injectable()
export class AdministrativeGuard implements CanActivate {
	constructor(private readonly userAuthGuard: UserAuthGuard) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		await this.userAuthGuard.canActivate(context);
		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
		if (request.user.role !== 'ADMINISTRATIVO') {
			throw new ForbiddenException('Se requiere el rol administrativo');
		}
		return true;
	}
}
