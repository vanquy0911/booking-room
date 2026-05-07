import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { RefreshToken } from 'src/modules/auth/entities/auth.entity';
import * as crypto from 'crypto';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    // 1. Nếu không có token, bỏ qua cho Guard xử lý (để support @Public routes)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      // 2. Thử giải mã Access Token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // 3. Check bảo mật (Locked/Deleted) - Dù token còn hạn vẫn phải check
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        withDeleted: true,
      });

      this.checkUserStatus(user);

      // Token hợp lệ và User an toàn -> Gán user vào request và đi tiếp
      req['user'] = { id: user!.id, email: user!.email, role: user!.role };
      return next();
    } catch (error) {
      // Nếu là lỗi do checkUserStatus ném ra (Khóa/Xóa) -> Chặn luôn, không cho refresh
      if (
        error instanceof UnauthorizedException &&
        error.message !== 'Invalid or expired token' &&
        !error.message.includes('jwt expired')
      ) {
        throw error;
      }

      // 4. Access Token hết hạn hoặc hỏng -> Thử dùng Refresh Token từ Header
      const refreshToken = req.headers['x-refresh-token'] as string;
      if (!refreshToken) {
        return next(); // Không có refresh token thì để Guard ném 401 sau
      }

      try {
        await this.handleRefreshToken(req, res, refreshToken);
        return next();
      } catch (refreshError) {
        // Refresh thất bại (hết hạn, hỏng) -> Để Guard ném 401 sau
        return next();
      }
    }
  }

  // Helper check trạng thái user
  private checkUserStatus(user: User | null) {
    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị xóa');
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Tài khoản bị khóa đến ${user.lockedUntil.toLocaleString('vi-VN')}`,
      );
    }
  }

  // Xử lý đổi token mới
  private async handleRefreshToken(
    req: Request,
    res: Response,
    rawToken: string,
  ) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash, revokedAt: IsNull() },
      relations: ['user'],
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new Error('Refresh token invalid or expired');
    }

    const user = storedToken.user;
    this.checkUserStatus(user); // Check bảo mật lần nữa

    // TẠO ACCESS TOKEN MỚI
    const newAccessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
      },
    );

    // TOKEN ROTATION: Tạo Refresh Token mới
    const newRawRefreshToken = crypto.randomBytes(64).toString('hex');
    const newTokenHash = crypto
      .createHash('sha256')
      .update(newRawRefreshToken)
      .digest('hex');

    const newRefreshToken = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
      deviceInfo: storedToken.deviceInfo,
      ipAddress: storedToken.ipAddress,
    });

    // Thu hồi token cũ
    storedToken.revokedAt = new Date();
    await this.refreshTokenRepository.save(storedToken);
    await this.refreshTokenRepository.save(newRefreshToken);

    // QUAN TRỌNG: Ghi đè Access Token mới vào Header để Guard chạy sau thấy nó "hợp lệ"
    req.headers.authorization = `Bearer ${newAccessToken}`;

    // Trả token mới về cho Frontend qua Header
    res.setHeader('x-new-access-token', newAccessToken);
    res.setHeader('x-new-refresh-token', newRawRefreshToken);

    // Gán user vào request
    req['user'] = { id: user.id, email: user.email, role: user.role };
  }
}