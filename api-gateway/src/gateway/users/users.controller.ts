import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	HttpException,
	HttpStatus,
	Param,
	Patch,
	Post,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Controller('api/users')
export class UsersController {
	private readonly userServiceUrl: string;

	constructor(
		private readonly http: HttpService,
		private readonly config: ConfigService,
	) {
		this.userServiceUrl =
			this.config.get<string>('USER_SERVICE_URL') ?? 'http://localhost:3003';
	}

	@Post('activate')
	activate(@Body() input: unknown) {
		return this.forward('post', '/auth/activate', input);
	}

	@Post('login')
	login(@Body() input: unknown) {
		return this.forward('post', '/auth/login', input);
	}

	@Get('profiles')
	listProfiles() {
		return this.forward('get', '/profiles');
	}

	@Get('profiles/me')
	getMyProfile(@Headers('authorization') authorization?: string) {
		return this.forward('get', '/profiles/me', undefined, authorization);
	}

	@Patch('profiles/me')
	updateMyProfile(
		@Body() input: unknown,
		@Headers('authorization') authorization?: string,
	) {
		return this.forward('patch', '/profiles/me', input, authorization);
	}

	@Get('profiles/manage')
	listProfilesForManagement(@Headers('authorization') authorization?: string) {
		return this.forward('get', '/profiles/manage', undefined, authorization);
	}

	@Get('profiles/:id')
	getPublicProfile(@Param('id') id: string) {
		return this.forward('get', `/profiles/${encodeURIComponent(id)}`);
	}

	@Patch('profiles/:id/status')
	setProfileStatus(
		@Param('id') id: string,
		@Body() input: unknown,
		@Headers('authorization') authorization?: string,
	) {
		return this.forward(
			'patch',
			`/profiles/${encodeURIComponent(id)}/status`,
			input,
			authorization,
		);
	}

	@Get('me')
	getCurrentUser(@Headers('authorization') authorization?: string) {
		return this.forward('get', '/users/me', undefined, authorization);
	}

	@Get('me/addresses')
	listAddresses(@Headers('authorization') authorization?: string) {
		return this.forward('get', '/users/me/addresses', undefined, authorization);
	}

	@Post('me/addresses')
	addAddress(
		@Body() input: unknown,
		@Headers('authorization') authorization?: string,
	) {
		return this.forward('post', '/users/me/addresses', input, authorization);
	}

	@Patch('me/addresses/:id/select')
	selectAddress(
		@Param('id') id: string,
		@Headers('authorization') authorization?: string,
	) {
		return this.forward(
			'patch',
			`/users/me/addresses/${encodeURIComponent(id)}/select`,
			undefined,
			authorization,
		);
	}

	@Delete('me/addresses/:id')
	deleteAddress(
		@Param('id') id: string,
		@Headers('authorization') authorization?: string,
	) {
		return this.forward(
			'delete',
			`/users/me/addresses/${encodeURIComponent(id)}`,
			undefined,
			authorization,
		);
	}

	private async forward(
		method: 'get' | 'post' | 'patch' | 'delete',
		path: string,
		input?: unknown,
		authorization?: string,
	) {
		try {
			const response = await firstValueFrom(
				this.http.request({
					method,
					url: `${this.userServiceUrl}${path}`,
					data: input,
					headers: authorization ? { authorization } : undefined,
				}),
			);
			return response.data;
		} catch (error) {
			if (
				typeof error === 'object' &&
				error !== null &&
				'response' in error &&
				error.response &&
				typeof error.response === 'object' &&
				'status' in error.response &&
				'data' in error.response
			) {
				throw new HttpException(
					error.response.data as Record<string, unknown> | string,
					error.response.status as number,
				);
			}
			throw new HttpException(
				'Error al comunicarse con el servicio de usuarios',
				HttpStatus.BAD_GATEWAY,
			);
		}
	}
}