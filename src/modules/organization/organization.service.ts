import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization_members.entity';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Location } from 'src/modules/location/entities/location.entity';
import { Floor } from '../location/entities/floor.entity';
import { User } from '../user/entities/user.entity';
import { InviteMemberDto } from './dto/invite-member.dto';
import { OrganizationInvitation } from './entities/organization_invitations.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private readonly organizationMemberRepository: Repository<OrganizationMember>,
    @InjectRepository(OrganizationInvitation)
    private readonly organizationInvitationRepository: Repository<OrganizationInvitation>,
    private readonly dataSource: DataSource,
  ) { }

  async create(createDto: CreateOrganizationDto, userId: string) {
    // Tạo đối tượng organization mới gắn với ownerId là người đang login
    const orgCount = await this.organizationMemberRepository.count({
      where: {
        userId: userId,
        role: 'admin',
        organization: {
          deletedAt: IsNull(),
        },
      },
      relations: ['organization'],
    });
    if (orgCount >= 5) {
      throw new ForbiddenException(
        'Mỗi tài khoản chỉ được tạo tối đa 5 tổ chức (Free Plan)',
      );
    }

    //slug
    let slug = createDto.name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const existingSlug = await this.organizationRepository.findOne({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    // lấy timezone của user
    const user = await this.organizationRepository.manager
      .getRepository(User)
      .findOne({ where: { id: userId } });

    const userTimezone = user?.timezone || 'UTC';
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // tạo transaction
    try {
      //tạo organization
      const neworg = this.organizationRepository.create({
        ...createDto,
        slug: slug,
        plan: 'free',
        defaultTimezone: userTimezone,
      });
      const savedorg = await queryRunner.manager.save(neworg);

      //tạo member
      const adminMember = this.organizationMemberRepository.create({
        organizationId: savedorg.id,
        userId: userId,
        role: 'admin',
      });
      await queryRunner.manager.save(adminMember);

      // tạo Location
      const defaultLocation = queryRunner.manager.create(Location, {
        name: 'default',
        slug: 'default',
        timezone: userTimezone,
        organizationId: savedorg.id,
      });

      const savedDefaultLocation =
        await queryRunner.manager.save(defaultLocation);

      // tạo Floor
      const defaultFloor = queryRunner.manager.create(Floor, {
        name: 'Ground',
        floorNumber: 0,
        locationId: savedDefaultLocation.id,
      });

      await queryRunner.manager.save(defaultFloor);

      await queryRunner.commitTransaction();
      return savedorg;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Lỗi khi tạo tổ chức' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async inviteMember(
    orgId: string,
    inviteDto: InviteMemberDto,
    inviterId: string,
  ) {
    const isAdmin = await this.organizationMemberRepository.findOne({
      where: { organizationId: orgId, userId: inviterId, role: 'admin' },
    });
    if (!isAdmin) {
      throw new ForbiddenException(
        'Bạn không có quyền mời thành viên vào tổ chức',
      );
    }

    const inviter = await this.dataSource.getRepository(User).findOne({
      where: { id: inviterId },
      select: ['fullName', 'email'],
    });

    const inviterEmail = inviter?.email || 'N/A';
    const inviterName = inviter?.fullName || 'Admin';
    const token = uuidv4();
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7);

    const invitation = this.organizationInvitationRepository.create({
      organizationId: orgId,
      email: inviteDto.email,
      tokenHash: token,
      invitedBy: inviterId,
      expiresAt: expiredAt,
    });
    await this.organizationInvitationRepository.save(invitation);

    const inviteLink = `http://localhost:3000/register?invitation_token=${token}`;

    console.log(`--- GỬI EMAIL ---`);
    console.log(`Từ: ${inviterName} <${inviterEmail}>`);
    console.log(`Tới: ${inviteDto.email}`);
    console.log(
      `Nội dung: ${inviterName} (${inviterEmail}) đã mời bạn tham gia tổ chức. Link: ${inviteLink}`,
    );

    return {
      message: 'Lời mời đã được gửi thành công',
      sentFrom: inviterEmail,
      inviterName: inviterName,
    };
  }
  async findAllByUser(userId: string) {
    const membership = await this.organizationMemberRepository.find({
      where: { userId: userId },
      relations: ['organization'],
    });
    return membership.map(member => member.organization);
  }
  async verifyInvitation(token: string) {
    if (!token) {
      throw new BadRequestException('Mã xác nhận không hợp lệ');
    }

    const invitation = await this.organizationInvitationRepository.findOne({
      where: { tokenHash: token },
      relations: ['organization', 'inviter'],
    });

    if (!invitation) {
      throw new BadRequestException('Lời mời không tồn tại hoặc mã xác nhận sai');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Lời mời này đã được sử dụng');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Lời mời đã hết hạn');
    }

    return {
      isValid: true,
      email: invitation.email,
      role: invitation.role,
      organization: {
        id: invitation.organization.id,
        name: invitation.organization.name,
      },
      inviter: {
        name: invitation.inviter?.fullName,
        email: invitation.inviter?.email,
      },
    };
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.organizationInvitationRepository.findOne({
      where: { tokenHash: token }
    });

    if (!invitation || invitation.acceptedAt) {
      return;
    }

    // Đánh dấu lời mời đã được sử dụng
    invitation.acceptedAt = new Date();
    await this.organizationInvitationRepository.save(invitation);

    // Thêm user vào organization
    const member = this.organizationMemberRepository.create({
      organizationId: invitation.organizationId,
      userId: userId,
      role: invitation.role,
    });
    await this.organizationMemberRepository.save(member);
  }

  async getMembers(orgId: string, userId: string) {
    // Kiểm tra xem người request có thuộc tổ chức này không (bảo mật)
    const isMember = await this.organizationMemberRepository.findOne({
      where: { organizationId: orgId, userId: userId },
    });

    if (!isMember) {
      throw new ForbiddenException('Bạn không có quyền xem danh sách thành viên của tổ chức này');
    }

    // Lấy danh sách thành viên kèm theo thông tin User
    const members = await this.organizationMemberRepository.find({
      where: { organizationId: orgId },
      relations: ['user'], // Cần join với bảng User
      order: { joinedAt: 'ASC' }, // Sắp xếp theo ngày tham gia
    });

    // Map lại dữ liệu để trả về những thông tin cần thiết, ẩn đi mật khẩu của user
    return members.map(member => ({
      memberId: member.id,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user ? {
        id: member.user.id,
        fullName: member.user.fullName,
        email: member.user.email,
        timezone: member.user.timezone,
      } : null
    }));
  }
}