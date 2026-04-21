import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { BookingModule } from './booking/booking.module';
import { RoomModule } from './room/room.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationModule } from './organization/organization.module';
import { LocationModule } from './location/location.module';
import { AmenityModule } from './amenity/amenity.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
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
  providers: [AppService],
})
export class AppModule {}
