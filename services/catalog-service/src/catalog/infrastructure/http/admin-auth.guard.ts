import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

interface TokenClaims {
	sub?: unknown;
	email?: unknown;
	role?: unknown;
	exp?: unknown;
}

@Injectable()
export class CatalogAuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<Request & {
			user?: { sub: string; email: string; role: string };
		}>();
		const authorization = request.headers.authorization;
		if (!authorization?.startsWith('Bearer ')) {
			throw new UnauthorizedException('Se requiere una sesión válida');
		}

		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new Error('JWT_SECRET debe configurarse en el servicio de catálogo');
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
			) as TokenClaims;
			if (typeof claims.exp !== 'number' || claims.exp <= Date.now() / 1000) {
				throw new UnauthorizedException('La sesión expiró');
			}
			if (
				typeof claims.sub !== 'string' ||
				typeof claims.email !== 'string' ||
				typeof claims.role !== 'string'
			) {
				throw new UnauthorizedException('Token inválido');
			}
			request.user = {
				sub: claims.sub,
				email: claims.email,
				role: claims.role,
			};
			return true;
		} catch (error) {
			if (
				error instanceof UnauthorizedException ||
				error instanceof ForbiddenException
			) {
				throw error;
			}
			throw new UnauthorizedException('Token inválido');
		}
	}
}

@Injectable()
export class AdminAuthGuard extends CatalogAuthGuard {
	canActivate(context: ExecutionContext): boolean {
		super.canActivate(context);
		const request = context.switchToHttp().getRequest<Request & {
			user: { sub: string; email: string; role: string };
		}>();
		if (request.user.role !== 'ADMINISTRATIVO') {
			throw new ForbiddenException('Se requiere el rol administrativo');
		}
		return true;
	}
}
