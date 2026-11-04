export const PASSWORD_VERIFIER = Symbol('PASSWORD_VERIFIER');

export interface PasswordVerifier {
	verify(password: string, passwordHash: string): Promise<boolean>;
}