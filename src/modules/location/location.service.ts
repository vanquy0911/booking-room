import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';

import { Location } from './entities/location.entity';
import { Floor } from './entities/floor.entity';
import { OrganizationMember } from '../organization/entities/organization_members.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,

    @InjectRepository(Floor)
    private readonly floorRepository: Repository<Floor>,

    @InjectRepository(OrganizationMember)
    private readonly organizationMemberRepository: Repository<OrganizationMember>,
  ) {}

  private async getMembership(orgId: string, userId: string) {
    const membership = await this.organizationMemberRepository.findOne({
      where: { organizationId: orgId, userId },
      relations: ['organization'],
    });

    if (!membership) {
      throw new ForbiddenException('Bạn không thuộc về tổ chức này');
    }

    return membership;
  }

  async create(orgId: string, userId: string, dto: CreateLocationDto) {
    const membership = await this.getMembership(orgId, userId);

    // Generate slug từ name
    const slug = slugify(dto.name, {
      lower: true,
      strict: true,
      trim: true,
    });

    // Check slug unique trong organization
    const existingLocation = await this.locationRepository.findOne({
      where: {
        organizationId: orgId,
        slug,
      },
    });

    if (existingLocation) {
      throw new BadRequestException('Slug đã tồn tại trong organization');
    }

    // Tạo location
    const location = this.locationRepository.create({
      name: dto.name,
      slug,
      timezone: membership.organization?.defaultTimezone || 'UTC',
      organizationId: orgId,
      address: dto.address,
    });

    // Lưu DB
    const savedLocation = await this.locationRepository.save(location);

    return {
      message: 'Tạo location thành công',
      data: savedLocation,
    };
  }

  async createFloor(
    locationId: string,
    orgId: string,
    userId: string,
    dto: CreateFloorDto,
  ) {
    await this.getMembership(orgId, userId);

    // Kiểm tra xem location có tồn tại và thuộc org này không
    const location = await this.locationRepository.findOne({
      where: { id: locationId, organizationId: orgId },
    });

    if (!location) {
      throw new BadRequestException(
        'Location không tồn tại hoặc không thuộc tổ chức này',
      );
    }

    // Tạo floor
    const floor = this.floorRepository.create({
      name: dto.name,
      floorNumber: dto.floorNumber,
      locationId: locationId,
    });

    const savedFloor = await this.floorRepository.save(floor);

    return {
      message: 'Tạo floor thành công',
      data: savedFloor,
    };
  }

  async findAllLocations(orgId: string) {
    return this.locationRepository.find({
      where: { organizationId: orgId },
      order: { name: 'ASC' },
    });
  }

  async findOneLocation(locationId: string, orgId: string) {
    const location = await this.locationRepository.findOne({
      where: { id: locationId, organizationId: orgId },
    });
    if (!location) throw new BadRequestException('Location không tồn tại');

    // Tải kèm danh sách floor
    const floors = await this.floorRepository.find({
      where: { locationId: locationId },
      order: { floorNumber: 'ASC' },
    });

    return { ...location, floors };
  }

  async updateLocation(
    locationId: string,
    orgId: string,
    dto: UpdateLocationDto,
  ) {
    const location = await this.locationRepository.findOne({
      where: { id: locationId, organizationId: orgId },
    });
    if (!location) throw new BadRequestException('Location không tồn tại');

    if (dto.name && dto.name !== location.name) {
      const slug = slugify(dto.name, { lower: true, strict: true, trim: true });
      const existing = await this.locationRepository.findOne({
        where: { organizationId: orgId, slug },
      });
      if (existing && existing.id !== locationId) {
        throw new BadRequestException('Slug đã tồn tại trong organization');
      }
      location.slug = slug;
      location.name = dto.name;
    }

    if (dto.address !== undefined) {
      location.address = dto.address;
    }

    const savedLocation = await this.locationRepository.save(location);
    return {
      message: 'Cập nhật location thành công',
      data: savedLocation,
    };
  }

  async removeLocation(locationId: string, orgId: string) {
    const location = await this.locationRepository.findOne({
      where: { id: locationId, organizationId: orgId },
    });
    if (!location) throw new BadRequestException('Location không tồn tại');

    await this.locationRepository.remove(location);
    return { message: 'Xóa location thành công' };
  }

  async findAllFloors(locationId: string, orgId: string) {
    return this.floorRepository.find({
      where: { locationId },
      order: { floorNumber: 'ASC' },
    });
  }

  async findOneFloor(floorId: string, locationId: string, orgId: string) {
    const floor = await this.floorRepository.findOne({
      where: { id: floorId, locationId },
    });
    if (!floor) throw new BadRequestException('Floor không tồn tại');
    return floor;
  }

  async updateFloor(
    floorId: string,
    locationId: string,
    orgId: string,
    dto: UpdateFloorDto,
  ) {
    const floor = await this.floorRepository.findOne({
      where: { id: floorId, locationId },
    });
    if (!floor) throw new BadRequestException('Floor không tồn tại');

    if (dto.name) floor.name = dto.name;
    if (dto.floorNumber !== undefined) floor.floorNumber = dto.floorNumber;

    const savedFloor = await this.floorRepository.save(floor);
    return {
      message: 'Cập nhật floor thành công',
      data: savedFloor,
    };
  }

  async removeFloor(floorId: string, locationId: string, orgId: string) {
    const floor = await this.floorRepository.findOne({
      where: { id: floorId, locationId },
    });
    if (!floor) throw new BadRequestException('Floor không tồn tại');

    await this.floorRepository.remove(floor);
    return { message: 'Xóa floor thành công' };
  }
}
