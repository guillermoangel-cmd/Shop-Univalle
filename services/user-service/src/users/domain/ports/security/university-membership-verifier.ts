export const UNIVERSITY_MEMBERSHIP_VERIFIER = Symbol(
	'UNIVERSITY_MEMBERSHIP_VERIFIER',
);

export interface UniversityMembershipVerifier {
	isUniversityEmail(email: string): Promise<boolean>;
}