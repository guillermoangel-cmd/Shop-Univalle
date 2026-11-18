import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	NotFoundException,
	Param,
	Post,
	Patch,
	Req,
	UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import type { Model } from 'mongoose';
import type { AuthenticatedRequest } from './user-auth.guard.js';
import { UserAuthGuard } from './user-auth.guard.js';
import {
	type CustomerAddress,
	UserMongoDocument,
} from '../persistence/user-mongo.schema.js';

@Controller('users/me')
@UseGuards(UserAuthGuard)
export class CustomerAddressesController {
	constructor(
		@InjectModel(UserMongoDocument.name)
		private readonly userModel: Model<UserMongoDocument>,
	) {}

	@Get()
	async getCurrentUser(@Req() request: AuthenticatedRequest) {
		const user = await this.userModel
			.findById(request.user.sub)
			.select('nombre email rol addresses selectedAddressId')
			.lean()
			.exec();
		if (!user) {
			throw new NotFoundException('No se encontró la cuenta');
		}
		return {
			id: String(user._id),
			name: user.nombre,
			email: user.email,
			role: String(user.rol) === 'ADMINISTRADOR'
				? 'ADMINISTRATIVO'
				: user.rol,
			addresses: user.addresses ?? [],
			selectedAddressId: user.selectedAddressId ?? null,
		};
	}

	@Get('addresses')
	async list(@Req() request: AuthenticatedRequest) {
		const user = await this.userModel
			.findById(request.user.sub)
			.select('addresses selectedAddressId')
			.lean()
			.exec();
		if (!user) {
			throw new NotFoundException('No se encontró la cuenta');
		}
		return {
			addresses: user.addresses ?? [],
			selectedAddressId: user.selectedAddressId ?? null,
		};
	}

	@Post('addresses')
	async add(
		@Req() request: AuthenticatedRequest,
		@Body() input: { label?: unknown; address?: unknown; details?: unknown },
	) {
		if (
			typeof input.label !== 'string' ||
			!input.label.trim() ||
			input.label.trim().length > 40 ||
			typeof input.address !== 'string' ||
			!input.address.trim() ||
			input.address.trim().length > 240 ||
			(input.details !== undefined &&
				(typeof input.details !== 'string' || input.details.trim().length > 240))
		) {
			throw new BadRequestException('Completa una etiqueta y dirección válidas');
		}
		const user = await this.userModel.findById(request.user.sub).exec();
		if (!user) {
			throw new NotFoundException('No se encontró la cuenta');
		}
		const address: CustomerAddress = {
			id: randomUUID(),
			label: input.label.trim(),
			address: input.address.trim(),
			details: typeof input.details === 'string' ? input.details.trim() : '',
		};
		user.addresses = [...(user.addresses ?? []), address];
		user.selectedAddressId = address.id;
		await user.save();
		return {
			addresses: user.addresses,
			selectedAddressId: user.selectedAddressId,
		};
	}

	@Patch('addresses/:id/select')
	async select(
		@Req() request: AuthenticatedRequest,
		@Param('id') addressId: string,
	) {
		const user = await this.userModel.findById(request.user.sub).exec();
		if (!user) {
			throw new NotFoundException('No se encontró la cuenta');
		}
		if (!(user.addresses ?? []).some((address) => address.id === addressId)) {
			throw new NotFoundException('No se encontró la dirección indicada');
		}
		user.selectedAddressId = addressId;
		await user.save();
		return {
			addresses: user.addresses,
			selectedAddressId: user.selectedAddressId,
		};
	}

	@Delete('addresses/:id')
	async remove(
		@Req() request: AuthenticatedRequest,
		@Param('id') addressId: string,
	) {
		const user = await this.userModel.findById(request.user.sub).exec();
		if (!user) {
			throw new NotFoundException('No se encontró la cuenta');
		}
		const addresses = (user.addresses ?? []).filter(
			(address) => address.id !== addressId,
		);
		if (addresses.length === (user.addresses ?? []).length) {
			throw new NotFoundException('No se encontró la dirección indicada');
		}
		user.addresses = addresses;
		if (user.selectedAddressId === addressId) {
			user.selectedAddressId = addresses[0]?.id ?? null;
		}
		await user.save();
		return {
			addresses: user.addresses,
			selectedAddressId: user.selectedAddressId,
		};
	}
}
