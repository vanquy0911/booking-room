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
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/auth.entity';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

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

  async login(
    body: LoginDto,
    metadata?: { ipAddress?: string | null; deviceInfo?: string | null },
  ) {
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

    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');
    const refreshToken = new RefreshToken();
    refreshToken.userId = user.id;
    refreshToken.tokenHash = tokenHash;
    refreshToken.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    refreshToken.ipAddress = metadata?.ipAddress ?? null;
    refreshToken.deviceInfo = metadata?.deviceInfo ?? null;
    await this.refreshTokenRepository.save(refreshToken);

    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
