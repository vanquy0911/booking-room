import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { Floor } from './entities/floor.entity';
import { OrganizationMember } from '../organization/entities/organization_members.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Floor, OrganizationMember])],
  controllers: [LocationController],
  providers: [LocationService],
})
export class LocationModule { }