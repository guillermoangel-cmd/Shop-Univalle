import {
	BadRequestException,
	ConflictException,
	Controller,
	Delete,
	Get,
	NotFoundException,
	Param,
	Patch,
	Post,
	Body,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CategoryAlreadyExistsError, CategoryHasProductsError, CategoryNotFoundError } from '../../application/errors/category.errors.js';
import { ActivateCategoryUseCase } from '../../application/use-cases/activate-category.use-case.js';
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case.js';
import { DeactivateCategoryUseCase } from '../../application/use-cases/deactivate-category.use-case.js';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case.js';
import { UpdateCategoryUseCase } from '../../application/use-cases/update-category.use-case.js';
import { InvalidCategoryError, type CategoryData } from '../../domain/entities/category.entity.js';
import { CatalogAuthGuard } from './admin-auth.guard.js';

interface AuthenticatedCategoryRequest extends Request {
	user: { sub: string; email: string; role: string };
}

@Controller('categories')
export class CategoriesController {
	constructor(
		private readonly createCategory: CreateCategoryUseCase,
		private readonly listCategories: ListCategoriesUseCase,
		private readonly updateCategory: UpdateCategoryUseCase,
		private readonly deactivateCategory: DeactivateCategoryUseCase,
		private readonly activateCategory: ActivateCategoryUseCase,
	) {}

	@Get()
	findAll(@Query('profileId') profileId?: string) {
		return this.listCategories.execute(false, profileId);
	}

	@Get('manage')
	@UseGuards(CatalogAuthGuard)
	listForManagement(@Req() request: AuthenticatedCategoryRequest) {
		return this.listCategories.execute(true, request.user.sub);
	}

	@Post()
	@UseGuards(CatalogAuthGuard)
	async create(
		@Body() input: CategoryData,
		@Req() request: AuthenticatedCategoryRequest,
	) {
		try {
			return await this.createCategory.execute(input, request.user.sub);
		} catch (error) {
			this.handleError(error);
		}
	}

	@Patch(':id')
	@UseGuards(CatalogAuthGuard)
	async update(
		@Param('id') id: string,
		@Body() input: Partial<CategoryData>,
		@Req() request: AuthenticatedCategoryRequest,
	) {
		try {
			return await this.updateCategory.execute(id, input, request.user.sub);
		} catch (error) {
			this.handleError(error);
		}
	}

	@Patch(':id/activate')
	@UseGuards(CatalogAuthGuard)
	async activate(
		@Param('id') id: string,
		@Req() request: AuthenticatedCategoryRequest,
	) {
		try {
			return await this.activateCategory.execute(id, request.user.sub);
		} catch (error) {
			this.handleError(error);
		}
	}

	@Delete(':id')
	@UseGuards(CatalogAuthGuard)
	async deactivate(
		@Param('id') id: string,
		@Req() request: AuthenticatedCategoryRequest,
	) {
		try {
			return await this.deactivateCategory.execute(id, request.user.sub);
		} catch (error) {
			this.handleError(error);
		}
	}

	private handleError(error: unknown): never {
		if (error instanceof InvalidCategoryError) {
			throw new BadRequestException(error.message);
		}
		if (error instanceof CategoryAlreadyExistsError) {
			throw new ConflictException(error.message);
		}
		if (error instanceof CategoryNotFoundError) {
			throw new NotFoundException(error.message);
		}
		if (error instanceof CategoryHasProductsError) {
			throw new ConflictException(error.message);
		}
		if (
			typeof error === 'object' &&
			error !== null &&
			'code' in error &&
			error.code === 11000
		) {
			throw new ConflictException('Ya existe una categoría con ese nombre');
		}
		throw error;
	}
}
