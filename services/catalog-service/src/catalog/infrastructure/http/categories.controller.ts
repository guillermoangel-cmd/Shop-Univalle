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
	UseGuards,
} from '@nestjs/common';
import { CategoryAlreadyExistsError, CategoryHasProductsError, CategoryNotFoundError } from '../../application/errors/category.errors.js';
import { ActivateCategoryUseCase } from '../../application/use-cases/activate-category.use-case.js';
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case.js';
import { DeactivateCategoryUseCase } from '../../application/use-cases/deactivate-category.use-case.js';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case.js';
import { UpdateCategoryUseCase } from '../../application/use-cases/update-category.use-case.js';
import { InvalidCategoryError, type CategoryData } from '../../domain/entities/category.entity.js';
import { AdminAuthGuard } from './admin-auth.guard.js';

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
	findAll() {
		return this.listCategories.execute();
	}

	@Get('manage')
	@UseGuards(AdminAuthGuard)
	listForManagement() {
		return this.listCategories.execute(true);
	}

	@Post()
	@UseGuards(AdminAuthGuard)
	async create(@Body() input: CategoryData) {
		try {
			return await this.createCategory.execute(input);
		} catch (error) {
			this.handleError(error);
		}
	}

	@Patch(':id')
	@UseGuards(AdminAuthGuard)
	async update(@Param('id') id: string, @Body() input: Partial<CategoryData>) {
		try {
			return await this.updateCategory.execute(id, input);
		} catch (error) {
			this.handleError(error);
		}
	}

	@Patch(':id/activate')
	@UseGuards(AdminAuthGuard)
	async activate(@Param('id') id: string) {
		try {
			return await this.activateCategory.execute(id);
		} catch (error) {
			this.handleError(error);
		}
	}

	@Delete(':id')
	@UseGuards(AdminAuthGuard)
	async deactivate(@Param('id') id: string) {
		try {
			return await this.deactivateCategory.execute(id);
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
