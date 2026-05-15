import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingAttendee } from './entities/booking_attendee.entity';
import { Room } from '../room/entities/room.entity';
import { Organization } from '../organization/entities/organization.entity';

import { OrganizationMember } from '../organization/entities/organization_members.entity';
import { BookingSeries } from './entities/booking_series.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Booking,
      BookingAttendee,
      BookingSeries,
      Room,
      Organization,
      OrganizationMember,
    ]),
  ],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
