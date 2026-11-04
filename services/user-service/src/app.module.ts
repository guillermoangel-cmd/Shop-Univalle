import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module.js';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ['../../.env', '.env'],
		}),
		MongooseModule.forRoot(
			process.env.MONGODB_URI ??
				'mongodb://127.0.0.1:27017/univalle_users',
		),
		UsersModule,
	],
})
export class AppModule {}