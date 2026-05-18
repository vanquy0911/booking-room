import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { Floor } from '../location/entities/floor.entity';
import { OrganizationMember } from '../organization/entities/organization_members.entity';
import { Amenity } from '../amenity/entities/amenities.entity';
import { RoomAmenity } from '../amenity/entities/room_amenities.entity';
import { RoomPhoto } from './entities/room_photo.entity';
import { CloudinaryModule } from '../../commons/cloudinary/cloudinary.module';
import { Booking } from '../booking/entities/booking.entity';
import { MaintenanceBlock } from './entities/maintenance_blocks.entity';
import { AuditModule } from '../audit_log/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Room,
      Floor,
      OrganizationMember,
      Amenity,
      RoomAmenity,
      RoomPhoto,
      Booking,
      MaintenanceBlock,
    ]),
    CloudinaryModule,
    AuditModule,
  ],
  controllers: [RoomController],
  providers: [RoomService],
})
export class RoomModule {}
