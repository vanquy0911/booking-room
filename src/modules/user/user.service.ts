import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { LockUserDto } from './dto/lock-user.dto';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from '../auth/entities/auth.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersService: Repository<User>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) { }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersService.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'fullName', 'avatarUrl', 'role'],
    });
  }

  async create(user: Partial<User>): Promise<User> {
    const newUser = this.usersService.create(user);
    return this.usersService.save(newUser);
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Loại bỏ trường password trước khi trả về
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async findAll() {
    const users = await this.usersService.find();

    return users.map((user) => {
      const { password, ...result } = user;
      return result;
    });
  }

  findOne(id: string): Promise<User | null> {
    return this.usersService.findOne({ where: { id } });
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersService.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'password',
        'fullName',
        'avatarUrl',
        'role',
        'timezone',
        'locale',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { oldPassword, newPassword, ...otherData } = updateProfileDto;
    if (oldPassword && newPassword) {
      const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
      console.log({
        oldPassword,
        dbPassword: user.password,
        isPasswordMatch,
      });
      if (!isPasswordMatch) {
        throw new BadRequestException('Old password is not correct');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    Object.assign(user, otherData);
    await this.usersService.save(user);

    const { password, ...updatedUser } = user;
    return updatedUser;
  }

  // ===================== LOCK USER =====================
  async lockUser(targetUserId: string, dto: LockUserDto, requesterId: string) {
    if (targetUserId === requesterId) {
      throw new BadRequestException('Bạn không thể tự khóa tài khoản của mình');
    }
    const target = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!target) throw new NotFoundException('Không tìm thấy user');
    if (target.role === 'admin') throw new ForbiddenException('Không thể khóa tài khoản Admin');

    const lockedUntil = dto.lockedUntil
      ? new Date(dto.lockedUntil)
      : new Date('9999-12-31');

    await this.userRepository.update({ id: targetUserId }, { lockedUntil });
    await this.refreshTokenRepository.update(
      { userId: targetUserId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    return {
      message: `Đã khóa tài khoản ${target.email}`,
      lockedUntil,
      reason: dto.reason,
    };
  }

  // ===================== UNLOCK USER =====================
  async unlockUser(targetUserId: string) {
    const target = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!target) throw new NotFoundException('Không tìm thấy user');

    await this.userRepository.update({ id: targetUserId }, { lockedUntil: undefined });
    return { message: `Đã mở khóa tài khoản ${target.email}` };
  }

  // ===================== DELETE USER (SOFT) =====================
  async deleteUser(targetUserId: string, requesterId: string) {
    if (targetUserId === requesterId) {
      throw new BadRequestException('Bạn không thể tự xóa tài khoản của mình');
    }
    const target = await this.userRepository.findOne({
      where: { id: targetUserId },
      withDeleted: true,
    });
    if (!target) throw new NotFoundException('Không tìm thấy user');
    if (target.deletedAt) throw new BadRequestException('Tài khoản đã bị xóa trước đó');
    if (target.role === 'admin') throw new ForbiddenException('Không thể xóa tài khoản Admin');

    // Thu hồi toàn bộ Refresh Token → Buộc đăng xuất ngay
    await this.refreshTokenRepository.update(
      { userId: targetUserId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    await this.userRepository.softDelete({ id: targetUserId });
    return { message: `Đã xóa tài khoản ${target.email}` };
  }

  // ===================== RESTORE USER =====================
  async restoreUser(targetUserId: string) {
    const target = await this.userRepository.findOne({
      where: { id: targetUserId },
      withDeleted: true,
    });
    if (!target || !target.deletedAt) {
      throw new BadRequestException('Tài khoản không ở trạng thái đã xóa');
    }
    await this.userRepository.restore({ id: targetUserId });
    return { message: `Đã khôi phục tài khoản ${target.email}` };
  }


}
