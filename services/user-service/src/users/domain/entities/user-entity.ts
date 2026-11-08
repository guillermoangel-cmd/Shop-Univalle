export class UserDomainError extends Error {}

export const USER_ROLES = [
	'ESTUDIANTE',
	'DOCENTE',
	'ADMINISTRATIVO',
	'ADMINISTRADOR',
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserState = 'ACTIVO' | 'INACTIVO';

export class UserEntity {
	constructor(
		public readonly id: string | null,
		public readonly name: string,
		public readonly email: string,
		public readonly passwordHash: string,
		public readonly role: UserRole = 'ESTUDIANTE',
		public readonly state: UserState = 'ACTIVO',
		public readonly emailVerified: boolean = true,
	) {}

	static create(
		name: string,
		email: string,
		passwordHash: string,
		role: UserRole = 'ESTUDIANTE',
	): UserEntity {
		if (
			typeof name !== 'string' ||
			typeof email !== 'string' ||
			typeof passwordHash !== 'string'
		) {
			throw new UserDomainError('El nombre, correo electrónico y contraseña son obligatorios');
		}

		const normalizedName = name.trim();
		const normalizedEmail = email.trim().toLowerCase();

		if (!normalizedName) {
			throw new UserDomainError('El nombre es obligatorio');
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
			throw new UserDomainError('El correo electrónico no es válido');
		}

		if (!passwordHash) {
			throw new UserDomainError('El hash de la contraseña es obligatorio');
		}

		return new UserEntity(
			null,
			normalizedName,
			normalizedEmail,
			passwordHash,
			role,
		);
	}
}
