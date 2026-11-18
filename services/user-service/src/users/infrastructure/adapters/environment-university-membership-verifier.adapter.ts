import { Injectable } from '@nestjs/common';
import type { UniversityMembershipVerifier } from '../../domain/ports/security/university-membership-verifier.js';

@Injectable()
export class EnvironmentUniversityMembershipVerifier implements UniversityMembershipVerifier {
	private readonly allowedDomains = (
		process.env.UNIVERSITY_EMAIL_DOMAINS ?? 'correounivalle.edu.co'
	)
		.split(',')
		.map((domain) => domain.trim().toLowerCase().replace(/^@/, ''))
		.filter(Boolean);

	async isUniversityEmail(email: string): Promise<boolean> {
		const normalizedEmail = email.trim().toLowerCase();
		const domain = normalizedEmail.split('@').at(-1);
		return Boolean(domain && this.allowedDomains.includes(domain));
	}
}