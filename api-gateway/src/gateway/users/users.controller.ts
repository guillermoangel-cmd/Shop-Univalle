import {
	Body,
	Controller,
	HttpException,
	HttpStatus,
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
		return this.forwardPost('/auth/activate', input);
	}

	@Post('login')
	login(@Body() input: unknown) {
		return this.forwardPost('/auth/login', input);
	}

	private async forwardPost(path: string, input: unknown) {
		try {
			const response = await firstValueFrom(
				this.http.post(`${this.userServiceUrl}${path}`, input),
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