import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';

@Module({
	imports: [HttpModule],
	controllers: [UsersController],
})
export class UsersModule {}