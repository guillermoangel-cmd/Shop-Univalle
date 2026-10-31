export class UserEntity {
	constructor(
		public readonly id: string | null,
		public readonly name: string,
		public readonly email: string,
		public readonly passwordHash: string,
	) {}

	static create(name: string, email: string, passwordHash: string): UserEntity {
		const normalizedName = name.trim();
		const normalizedEmail = email.trim().toLowerCase();

		if (!normalizedName) {
			throw new Error('Name is required');
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
			throw new Error('A valid email is required');
		}

		if (!passwordHash) {
			throw new Error('Password hash is required');
		}

		return new UserEntity(null, normalizedName, normalizedEmail, passwordHash);
	}
}
