import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { ProductsModule } from './gateway/products/products.module';
import { UsersModule } from './gateway/users/users.module';
import { OrdersModule } from './gateway/orders/orders.module';
import { CategoriesModule } from './gateway/categories/categories.module';
import { UploadsController } from './gateway/uploads/uploads.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    HttpModule,
    ProductsModule,
    UsersModule,
    OrdersModule,
    CategoriesModule,
  ],
  controllers: [UploadsController],
})
export class AppModule {}
