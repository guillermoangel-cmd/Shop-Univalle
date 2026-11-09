import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CatalogModule } from './catalog/catalog.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/univalle-catalog',
      {
        lazyConnection: true,
        serverSelectionTimeoutMS: 2500,
        connectionFactory: (connection) => {
          connection.on('error', () => {
            // Evita que la caida de Mongo local tumbe el proceso en desarrollo
          });
          return connection;
        },
      },
    ),
    CatalogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
