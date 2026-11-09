import {
	BadRequestException,
	Body,
	Controller,
	Get,
	NotFoundException,
	Param,
	Patch,
	Req,
	UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { AuthenticatedRequest } from './user-auth.guard.js';
import {
	AdministrativeGuard,
	UserAuthGuard,
} from './user-auth.guard.js';
import { ProfileMongoDocument } from '../persistence/user-mongo.schema.js';

@Controller('profiles')
export class ProfilesController {
	constructor(
		@InjectModel(ProfileMongoDocument.name)
		private readonly profileModel: Model<ProfileMongoDocument>,
	) {}

	@Get()
	async listShops() {
		const profiles = await this.profileModel
			.find({ active: true })
			.sort({ nickname: 1 })
			.lean()
			.exec();
		return profiles.map((profile) => ({
			id: profile.userId,
			userId: profile.userId,
			nickname: profile.nickname,
			address: profile.address,
			shippingCost: profile.shippingCost,
			active: profile.active,
		}));
	}

	@Get('me')
	@UseGuards(UserAuthGuard)
	async getMine(@Req() request: AuthenticatedRequest) {
		const profile = await this.profileModel
			.findOne({ userId: request.user.sub })
			.lean()
			.exec();
		if (!profile) {
			throw new BadRequestException('El perfil de tienda aún no está creado');
		}
		return {
			id: profile.userId,
			userId: profile.userId,
			nickname: profile.nickname,
			address: profile.address,
			shippingCost: profile.shippingCost,
			active: profile.active,
		};
	}

	@Patch('me')
	@UseGuards(UserAuthGuard)
	async updateMine(
		@Req() request: AuthenticatedRequest,
		@Body() input: { nickname?: unknown; address?: unknown; shippingCost?: unknown },
	) {
		const update: Partial<Pick<ProfileMongoDocument, 'nickname' | 'address' | 'shippingCost'>> = {};
		if (input.nickname !== undefined) {
			if (typeof input.nickname !== 'string' || !input.nickname.trim() || input.nickname.trim().length > 60) {
				throw new BadRequestException('El apodo debe tener entre 1 y 60 caracteres');
			}
			update.nickname = input.nickname.trim();
		}
		if (input.address !== undefined) {
			if (typeof input.address !== 'string' || input.address.trim().length > 240) {
				throw new BadRequestException('La dirección no puede superar 240 caracteres');
			}
			update.address = input.address.trim();
		}
		if (input.shippingCost !== undefined) {
			if (
				typeof input.shippingCost !== 'number' ||
				!Number.isSafeInteger(input.shippingCost) ||
				input.shippingCost < 0
			) {
				throw new BadRequestException('El costo de envío debe ser un valor entero no negativo');
			}
			update.shippingCost = input.shippingCost;
		}
		if (Object.keys(update).length === 0) {
			throw new BadRequestException('Indica al menos un dato para actualizar');
		}

		const profile = await this.profileModel
			.findOneAndUpdate(
				{ userId: request.user.sub },
				{ $set: update },
				{ new: true, runValidators: true },
			)
			.lean()
			.exec();
		if (!profile) {
			throw new BadRequestException('El perfil de tienda aún no está creado');
		}
		return {
			id: profile.userId,
			userId: profile.userId,
			nickname: profile.nickname,
			address: profile.address,
			shippingCost: profile.shippingCost,
			active: profile.active,
		};
	}

	@Get('manage')
	@UseGuards(AdministrativeGuard)
	async listForModeration() {
		const profiles = await this.profileModel.find().sort({ nickname: 1 }).lean().exec();
		return profiles.map((profile) => ({
			id: profile.userId,
			userId: profile.userId,
			nickname: profile.nickname,
			address: profile.address,
			shippingCost: profile.shippingCost,
			active: profile.active,
		}));
	}

	@Get(':id')
	async getPublicProfile(@Param('id') userId: string) {
		const profile = await this.profileModel
			.findOne({ userId, active: true })
			.lean()
			.exec();
		if (!profile) {
			throw new NotFoundException('La tienda no está disponible');
		}
		return {
			id: profile.userId,
			userId: profile.userId,
			nickname: profile.nickname,
			address: profile.address,
			shippingCost: profile.shippingCost,
			active: profile.active,
		};
	}

	@Patch(':id/status')
	@UseGuards(AdministrativeGuard)
	async setStatus(
		@Param('id') userId: string,
		@Body() input: { active?: unknown },
	) {
		if (typeof input.active !== 'boolean') {
			throw new BadRequestException('El estado activo debe ser verdadero o falso');
		}
		const profile = await this.profileModel
			.findOneAndUpdate({ userId }, { $set: { active: input.active } }, { new: true })
			.lean()
			.exec();
		if (!profile) {
			throw new BadRequestException('No se encontró el perfil indicado');
		}
		return {
			id: profile.userId,
			userId: profile.userId,
			nickname: profile.nickname,
			address: profile.address,
			shippingCost: profile.shippingCost,
			active: profile.active,
		};
	}
}
