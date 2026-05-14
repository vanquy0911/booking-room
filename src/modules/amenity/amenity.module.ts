import { Module } from '@nestjs/common';
import { AmenityService } from './amenity.service';
import { AmenityController } from './amenity.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Amenity } from './entities/amenities.entity';
import { RoomAmenity } from './entities/room_amenities.entity';
import { OrganizationMember } from '../organization/entities/organization_members.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Amenity, RoomAmenity, OrganizationMember]),
  ],
  controllers: [AmenityController],
  providers: [AmenityService],
  exports: [AmenityService],
})
export class AmenityModule {}
