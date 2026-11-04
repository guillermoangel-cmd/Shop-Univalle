import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { ProductsModule } from './gateway/products/products.module';
import { UsersModule } from './gateway/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    ProductsModule,
    UsersModule,
  ],
})
export class AppModule {}