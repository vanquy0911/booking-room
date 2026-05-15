import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Amenity } from './entities/amenities.entity';
import { OrganizationMember } from '../organization/entities/organization_members.entity';
import { CreateAmenityDto } from './dto/create-amenity.dto';
import { UpdateAmenityDto } from './dto/update-amenity.dto';

@Injectable()
export class AmenityService {
  constructor(
    @InjectRepository(Amenity)
    private readonly amenityRepository: Repository<Amenity>,

    @InjectRepository(OrganizationMember)
    private readonly organizationMemberRepository: Repository<OrganizationMember>,
  ) { }

  private async getMembership(orgId: string, userId: string) {
    const membership = await this.organizationMemberRepository.findOne({
      where: { organizationId: orgId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('Bạn không thuộc về tổ chức này');
    }

    return membership;
  }

  private checkAdmin(
    membership: OrganizationMember,
    errorMessage = 'Bạn không có quyền thực hiện thao tác này',
  ) {
    if (membership.role !== 'admin') {
      throw new ForbiddenException(errorMessage);
    }
  }

  async create(orgId: string, userId: string, dto: CreateAmenityDto) {
    const membership = await this.getMembership(orgId, userId);
    
    // 1. Kiểm tra quyền admin
    this.checkAdmin(membership, 'Bạn không có quyền tạo tiện ích');

    // 2. Kiểm tra tên tiện ích trùng trong organization
    const existing = await this.amenityRepository.findOne({
      where: { organizationId: orgId, name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Tiện ích này đã tồn tại trong tổ chức');
    }

    // 3. Tạo mới
    const amenity = this.amenityRepository.create({
      ...dto,
      organizationId: orgId,
    });

    return this.amenityRepository.save(amenity);
  }

  async findAll(orgId: string) {
    return this.amenityRepository.find({
      where: { organizationId: orgId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, orgId: string) {
    const amenity = await this.amenityRepository.findOne({
      where: { id, organizationId: orgId },
    });
    if (!amenity) throw new BadRequestException('Không tìm thấy tiện ích');
    return amenity;
  }

  async update(
    id: string,
    orgId: string,
    userId: string,
    dto: UpdateAmenityDto,
  ) {
    const membership = await this.getMembership(orgId, userId);
    this.checkAdmin(membership, 'Bạn không có quyền chỉnh sửa tiện ích');

    const amenity = await this.findOne(id, orgId);
    Object.assign(amenity, dto);
    return this.amenityRepository.save(amenity);
  }

  async remove(id: string, orgId: string, userId: string) {
    const membership = await this.getMembership(orgId, userId);
    this.checkAdmin(membership, 'Bạn không có quyền xóa tiện ích');

    const amenity = await this.findOne(id, orgId);
    await this.amenityRepository.remove(amenity);
    return { message: 'Xóa tiện ích thành công' };
  }
}
