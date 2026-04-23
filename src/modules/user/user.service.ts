import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private usersService: Repository<User>) { }

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

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
