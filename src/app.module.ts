import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { BookingModule } from './modules/booking/booking.module';
import { RoomModule } from './modules/room/room.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrganizationModule } from './modules/organization/organization.module';
import { LocationModule } from './modules/location/location.module';
import { AmenityModule } from './modules/amenity/amenity.module';
import { NotificationModule } from './modules/notification/notification.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './modules/user/entities/user.entity';
import { RefreshToken } from './modules/auth/entities/auth.entity';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './commons/guard/JwtAuthGuard.guard';
import { AuthMiddleware } from './commons/middlewares/auth.middleware';

@Module({
  imports: [
    // Cấu hình đọc file .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Cấu hình kết nối Database bằng TypeORM (lấy thông tin từ file .env)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT') || 5432,
        username:
          configService.get<string>('DB_USERNAME') ||
          configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    // Đăng ký Entity cho Middleware dùng
    TypeOrmModule.forFeature([User, RefreshToken]),

    UserModule,
    BookingModule,
    RoomModule,
    AuthModule,
    OrganizationModule,
    LocationModule,
    AmenityModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware) // Chạy trước để "sửa lỗi" token nếu cần
      .forRoutes('*');
  }
}

