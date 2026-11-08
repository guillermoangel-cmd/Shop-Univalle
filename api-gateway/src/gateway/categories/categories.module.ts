import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CategoriesController } from './categories.controller';

@Module({
	imports: [HttpModule],
	controllers: [CategoriesController],
})
export class CategoriesModule {}
