import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module.js';

@Module({
	imports: [
		MongooseModule.forRoot(
			process.env.MONGODB_URI ??
				'mongodb://127.0.0.1:27017/shop-univalle',
		),
		UsersModule,
	],
})
export class AppModule {}