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
      process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/univalle_users',
      {
        lazyConnection: true,
        serverSelectionTimeoutMS: 2500,
        connectionFactory: (connection) => {
          connection.on('error', () => {
            // Evita caída del servicio si Mongo local tarda o no está activo
          });
          return connection;
        },
      },
    ),
    UsersModule,
  ],
})
export class AppModule {}
