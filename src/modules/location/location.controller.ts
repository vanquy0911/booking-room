import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../commons/decorators/user.decorator';
import { OrgId, Membership } from '../../commons/decorators/tenant.decorator';
import { OrganizationMember } from '../organization/entities/organization_members.entity';

@ApiTags('location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) { }

  @Post(':orgId')
  @ApiOperation({ summary: 'Tạo location mới cho một tổ chức' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  createLocation(
    @OrgId() orgId: string,
    @Membership() membership: OrganizationMember,
    @Body() createLocationDto: CreateLocationDto,
  ) {
    return this.locationService.create(orgId, membership, createLocationDto);
  }

  @Post(':orgId/floor/:locationId')
  @ApiOperation({ summary: 'Tạo tầng (floor) mới cho một location' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  createFloor(
    @OrgId() orgId: string,
    @Param('locationId') locationId: string,
    @Membership() membership: OrganizationMember,
    @Body() createFloorDto: CreateFloorDto,
  ) {
    return this.locationService.createFloor(
      locationId,
      orgId,
      membership,
      createFloorDto,
    );
  }

  @Get(':orgId')
  @ApiOperation({ summary: 'Lấy danh sách location của tổ chức' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findAllLocations(@OrgId() orgId: string) {
    return this.locationService.findAllLocations(orgId);
  }

  @Get(':orgId/:locationId')
  @ApiOperation({ summary: 'Lấy chi tiết một location' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findOneLocation(
    @OrgId() orgId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.locationService.findOneLocation(locationId, orgId);
  }

  @Patch(':orgId/:locationId')
  @ApiOperation({ summary: 'Cập nhật location' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  updateLocation(
    @OrgId() orgId: string,
    @Param('locationId') locationId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationService.updateLocation(locationId, orgId, dto);
  }

  @Delete(':orgId/:locationId')
  @ApiOperation({ summary: 'Xóa location' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  removeLocation(
    @OrgId() orgId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.locationService.removeLocation(locationId, orgId);
  }

  @Get(':orgId/floor/:locationId')
  @ApiOperation({ summary: 'Lấy danh sách tầng của một location' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findAllFloors(
    @OrgId() orgId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.locationService.findAllFloors(locationId, orgId);
  }

  @Get(':orgId/floor/:locationId/:floorId')
  @ApiOperation({ summary: 'Lấy chi tiết một tầng' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findOneFloor(
    @OrgId() orgId: string,
    @Param('locationId') locationId: string,
    @Param('floorId') floorId: string,
  ) {
    return this.locationService.findOneFloor(
      floorId,
      locationId,
      orgId,
    );
  }

  @Patch(':orgId/floor/:locationId/:floorId')
  @ApiOperation({ summary: 'Cập nhật tầng' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  updateFloor(
    @OrgId() orgId: string,
    @Param('locationId') locationId: string,
    @Param('floorId') floorId: string,
    @Body() dto: UpdateFloorDto,
  ) {
    return this.locationService.updateFloor(
      floorId,
      locationId,
      orgId,
      dto,
    );
  }

  @Delete(':orgId/floor/:locationId/:floorId')
  @ApiOperation({ summary: 'Xóa tầng' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  removeFloor(
    @OrgId() orgId: string,
    @Param('locationId') locationId: string,
    @Param('floorId') floorId: string,
  ) {
    return this.locationService.removeFloor(floorId, locationId, orgId);
  }
}
