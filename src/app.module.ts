import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { BookingModule } from './modules/booking/booking.module';
import { RoomModule } from './modules/room/room.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { LocationModule } from './modules/location/location.module';
import { AmenityModule } from './modules/amenity/amenity.module';
import { NotificationModule } from './modules/notification/notification.module';

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
export class AppModule { }
