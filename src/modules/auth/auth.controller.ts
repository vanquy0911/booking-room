import {
  Controller,
  Post,
  Body,
  Put,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { UpdateProfileDto } from '../user/dto/update-profile.dto';
import { User } from 'src/commons/decorators/user.decorator';
import { Public } from 'src/commons/decorators/public.decorator';
import type { Request, Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() loginDto: LoginDto,
  ) {
    const result = await this.authService.login(loginDto, {
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent'],
    });
    res.setHeader('x-refresh-token', result.refresh_token);
    return result;
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@User() user: any) {
    const fulluser = await this.userService.findOne(user.id);
    if (fulluser) {
      const { password, ...result } = fulluser;
      return result;
    }
    return fulluser;
  }

  @Put('update')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, updateProfileDto);
  }
}
