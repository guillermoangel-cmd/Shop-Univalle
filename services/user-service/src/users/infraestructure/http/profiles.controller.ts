import {
	BadRequestException,
	Body,
	Controller,
	Delete,
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

const DEFAULT_PROFILE_IMAGE = '/assets/default_profile/perfil_default.webp';

function toProfileResponse(profile: ProfileMongoDocument) {
	return {
		id: profile.userId,
		userId: profile.userId,
		nickname: profile.nickname,
		address: profile.address,
		shippingCost: profile.shippingCost,
		imageUrl: profile.imageUrl || DEFAULT_PROFILE_IMAGE,
		active: profile.active,
	};
}

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
		return profiles.map(toProfileResponse);
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
		return toProfileResponse(profile as ProfileMongoDocument);
	}

	@Patch('me')
	@UseGuards(UserAuthGuard)
	async updateMine(
		@Req() request: AuthenticatedRequest,
		@Body() input: { nickname?: unknown; address?: unknown; shippingCost?: unknown; imageUrl?: unknown },
	) {
		const update: Partial<Pick<ProfileMongoDocument, 'nickname' | 'address' | 'shippingCost' | 'imageUrl'>> = {};
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
		if (input.imageUrl !== undefined) {
			if (
				typeof input.imageUrl !== 'string' ||
				input.imageUrl.length > 500 ||
				!(
					input.imageUrl === DEFAULT_PROFILE_IMAGE ||
					/^\/uploads\/assets\/user_perfiles_img\/[a-f0-9-]+\.(?:png|jpe?g|webp)$/i.test(input.imageUrl)
				)
			) {
				throw new BadRequestException('La imagen de perfil no es válida');
			}
			update.imageUrl = input.imageUrl;
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
		return toProfileResponse(profile as ProfileMongoDocument);
	}

	@Delete('me/image')
	@UseGuards(UserAuthGuard)
	async cleanupImage(
		@Req() request: AuthenticatedRequest,
		@Body() input: { imageUrl?: unknown },
	) {
		if (
			typeof input.imageUrl !== 'string' ||
			!input.imageUrl ||
			input.imageUrl === DEFAULT_PROFILE_IMAGE
		) {
			throw new BadRequestException('La imagen anterior no es válida');
		}
		const profile = await this.profileModel
			.findOne({ userId: request.user.sub })
			.lean()
			.exec();
		if (!profile) {
			throw new BadRequestException('El perfil de tienda aún no está creado');
		}
		if (profile.imageUrl === input.imageUrl) return { safeToDelete: false };
		const references = await this.profileModel.countDocuments({
			imageUrl: input.imageUrl,
			userId: { $ne: request.user.sub },
		}).exec();
		return { safeToDelete: references === 0 };
	}

	@Get('manage')
	@UseGuards(AdministrativeGuard)
	async listForModeration() {
		const profiles = await this.profileModel.find().sort({ nickname: 1 }).lean().exec();
		return profiles.map(toProfileResponse);
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
		return toProfileResponse(profile as ProfileMongoDocument);
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
		return toProfileResponse(profile as ProfileMongoDocument);
	}
}
