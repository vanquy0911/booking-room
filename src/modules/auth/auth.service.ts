import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) { }

  async register(body: RegisterDto) {
    const existingUser = await this.usersService.findOneByEmail(body.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newUser = await this.usersService.create({
      email: body.email,
      password: hashedPassword,
      fullName: body.fullName,
      timezone: body.timezone,
      locale: body.locale,
    });

    const { password, ...userWithoutPassword } = newUser;

    return {
      message: 'User registered successfully',
      user: userWithoutPassword,
    };
  }

  async login(body: LoginDto) {
    const user = await this.usersService.findOneByEmail(body.email);
    if (!user) {
      console.log('❌ Không tìm thấy User với email:', body.email); // Thêm log này
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Tạo payload để đóng gói vào JWT Token
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
