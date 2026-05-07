import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from './entities/user.entity';
import { User } from 'src/commons/decorators/user.decorator';
import { LockUserDto } from './dto/lock-user.dto';

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @ApiOperation({ summary: '[Admin] Lấy danh sách toàn bộ user' })
  async findAll(@User('role') role: string) {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Admin mới có quyền truy cập');
    }
    return this.userService.findAll();
  }

  @Patch(':id/lock')
  @ApiOperation({ summary: '[Admin] Khóa tài khoản user' })
  async lockUser(
    @Param('id') targetId: string,
    @Body() dto: LockUserDto,
    @User('id') requesterId: string,
    @User('role') role: string,
  ) {
    if (role !== Role.ADMIN) throw new ForbiddenException('Chỉ Admin mới có quyền này');
    return this.userService.lockUser(targetId, dto, requesterId);
  }

  @Patch(':id/unlock')
  @ApiOperation({ summary: '[Admin] Mở khóa tài khoản user' })
  async unlockUser(
    @Param('id') targetId: string,
    @User('role') role: string,
  ) {
    if (role !== Role.ADMIN) throw new ForbiddenException('Chỉ Admin mới có quyền này');
    return this.userService.unlockUser(targetId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Xóa mềm tài khoản user' })
  async deleteUser(
    @Param('id') targetId: string,
    @User('id') requesterId: string,
    @User('role') role: string,
  ) {
    if (role !== Role.ADMIN) throw new ForbiddenException('Chỉ Admin mới có quyền này');
    return this.userService.deleteUser(targetId, requesterId);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: '[Admin] Khôi phục tài khoản đã xóa' })
  async restoreUser(
    @Param('id') targetId: string,
    @User('role') role: string,
  ) {
    if (role !== Role.ADMIN) throw new ForbiddenException('Chỉ Admin mới có quyền này');
    return this.userService.restoreUser(targetId);
  }
}

