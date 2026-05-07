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

@ApiTags('location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) { }

  @Post(':orgId')
  @ApiOperation({ summary: 'Tạo location mới cho một tổ chức' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  createLocation(
    @Param('orgId') orgId: string,
    @User('id') userId: string,
    @Body() createLocationDto: CreateLocationDto,
  ) {
    return this.locationService.create(orgId, userId, createLocationDto);
  }

  @Post(':orgId/floor/:locationId')
  @ApiOperation({ summary: 'Tạo tầng (floor) mới cho một location' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  createFloor(
    @Param('orgId') orgId: string,
    @Param('locationId') locationId: string,
    @User('id') userId: string,
    @Body() createFloorDto: CreateFloorDto,
  ) {
    return this.locationService.createFloor(locationId, orgId, userId, createFloorDto);
  }


  @Get(':orgId')
  @ApiOperation({ summary: 'Lấy danh sách location của tổ chức' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findAllLocations(@Param('orgId') orgId: string, @User('id') userId: string) {
    return this.locationService.findAllLocations(orgId, userId);
  }

  @Get(':orgId/:locationId')
  @ApiOperation({ summary: 'Lấy chi tiết một location' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findOneLocation(
    @Param('orgId') orgId: string,
    @Param('locationId') locationId: string,
    @User('id') userId: string,
  ) {
    return this.locationService.findOneLocation(locationId, orgId, userId);
  }

  @Patch(':orgId/:locationId')
  @ApiOperation({ summary: 'Cập nhật location' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  updateLocation(
    @Param('orgId') orgId: string,
    @Param('locationId') locationId: string,
    @User('id') userId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationService.updateLocation(locationId, orgId, userId, dto);
  }

  @Delete(':orgId/:locationId')
  @ApiOperation({ summary: 'Xóa location' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  removeLocation(
    @Param('orgId') orgId: string,
    @Param('locationId') locationId: string,
    @User('id') userId: string,
  ) {
    return this.locationService.removeLocation(locationId, orgId, userId);
  }


  @Get(':orgId/floor/:locationId')
  @ApiOperation({ summary: 'Lấy danh sách tầng của một location' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findAllFloors(
    @Param('orgId') orgId: string,
    @Param('locationId') locationId: string,
    @User('id') userId: string,
  ) {
    return this.locationService.findAllFloors(locationId, orgId, userId);
  }

  @Get(':orgId/floor/:locationId/:floorId')
  @ApiOperation({ summary: 'Lấy chi tiết một tầng' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findOneFloor(
    @Param('orgId') orgId: string,
    @Param('locationId') locationId: string,
    @Param('floorId') floorId: string,
    @User('id') userId: string,
  ) {
    return this.locationService.findOneFloor(floorId, locationId, orgId, userId);
  }

  @Patch(':orgId/floor/:locationId/:floorId')
  @ApiOperation({ summary: 'Cập nhật tầng' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  updateFloor(
    @Param('orgId') orgId: string,
    @Param('locationId') locationId: string,
    @Param('floorId') floorId: string,
    @User('id') userId: string,
    @Body() dto: UpdateFloorDto,
  ) {
    return this.locationService.updateFloor(floorId, locationId, orgId, userId, dto);
  }

  @Delete(':orgId/floor/:locationId/:floorId')
  @ApiOperation({ summary: 'Xóa tầng' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  removeFloor(
    @Param('orgId') orgId: string,
    @Param('locationId') locationId: string,
    @Param('floorId') floorId: string,
    @User('id') userId: string,
  ) {
    return this.locationService.removeFloor(floorId, locationId, orgId, userId);
  }
}