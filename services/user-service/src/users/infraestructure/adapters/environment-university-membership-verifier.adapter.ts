import { Injectable } from '@nestjs/common';

@Injectable()
export class EnvironmentUniversityMembershipVerifier {
	private readonly allowedDomains = (process.env.UNIVERSITY_EMAIL_DOMAINS ?? '')
		.split(',')
		.map((domain) => domain.trim().toLowerCase().replace(/^@/, ''))
		.filter(Boolean);

	async isUniversityEmail(email: string): Promise<boolean> {
		const normalizedEmail = email.trim().toLowerCase();
		const domain = normalizedEmail.split('@').at(-1);
		return Boolean(domain && this.allowedDomains.includes(domain));
	}
}