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
import { AmenityService } from './amenity.service';
import { CreateAmenityDto } from './dto/create-amenity.dto';
import { UpdateAmenityDto } from './dto/update-amenity.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../commons/decorators/user.decorator';
import { OrgId, Membership } from '../../commons/decorators/tenant.decorator';
import { OrganizationMember } from '../organization/entities/organization_members.entity';

@ApiTags('amenity')
@Controller('amenity')
export class AmenityController {
  constructor(private readonly amenityService: AmenityService) {}

  @Post(':orgId')
  @ApiOperation({ summary: 'Tạo tiện ích mới' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  create(
    @OrgId() orgId: string,
    @Membership() membership: OrganizationMember,
    @Body() createAmenityDto: CreateAmenityDto,
  ) {
    return this.amenityService.create(orgId, membership, createAmenityDto);
  }

  @Get(':orgId')
  @ApiOperation({ summary: 'Lấy danh sách tiện ích của tổ chức' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findAll(@OrgId() orgId: string) {
    return this.amenityService.findAll(orgId);
  }

  @Get(':orgId/:id')
  @ApiOperation({ summary: 'Xem chi tiết tiện ích' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.amenityService.findOne(id, orgId);
  }

  @Patch(':orgId/:id')
  @ApiOperation({ summary: 'Cập nhật tiện ích' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Membership() membership: OrganizationMember,
    @Body() updateAmenityDto: UpdateAmenityDto,
  ) {
    return this.amenityService.update(id, orgId, membership, updateAmenityDto);
  }

  @Delete(':orgId/:id')
  @ApiOperation({ summary: 'Xóa tiện ích' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  remove(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Membership() membership: OrganizationMember,
  ) {
    return this.amenityService.remove(id, orgId, membership);
  }
}
