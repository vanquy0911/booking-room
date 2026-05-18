import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  Headers,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { FindBookingsDto } from './dto/find-bookings.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { InviteAttendeesDto } from './dto/invite-attendees.dto';
import { RejectBookingDto } from './dto/reject-booking.dto';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../commons/decorators/user.decorator';
import { ClientInfo, IClientInfo } from '../../commons/decorators/client-info.decorator';

@ApiTags('booking')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }

  @Post()
  @ApiOperation({ summary: 'Đặt phòng mới' })
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-org-id',
    description: 'ID của tổ chức',
    required: true,
  })
  @UseGuards(AuthGuard('jwt'))
  create(
    @Headers('x-org-id') orgId: string,
    @User('id') userId: string,
    @ClientInfo() clientInfo: IClientInfo,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingService.create(orgId, userId, createBookingDto, clientInfo);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đặt phòng' })
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-org-id',
    description: 'ID của tổ chức',
    required: true,
  })
  @UseGuards(AuthGuard('jwt'))
  findAll(
    @Headers('x-org-id') orgId: string,
    @User('id') userId: string,
    @Query() dto: FindBookingsDto,
  ) {
    return this.bookingService.findAll(orgId, userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết đặt phòng' })
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-org-id',
    description: 'ID của tổ chức',
    required: true,
  })
  @UseGuards(AuthGuard('jwt'))
  findOne(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
    return this.bookingService.findOne(orgId, id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Lịch sử thay đổi của đặt phòng' })
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-org-id',
    description: 'ID của tổ chức',
    required: true,
  })
  @UseGuards(AuthGuard('jwt'))
  getHistory(
    @Headers('x-org-id') orgId: string,
    @Param('id') id: string,
    @User('id') userId: string,
  ) {
    return this.bookingService.getBookingHistory(orgId, id, userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Hủy đặt phòng' })
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-org-id',
    description: 'ID của tổ chức',
    required: true,
  })
  @UseGuards(AuthGuard('jwt'))
  cancel(
    @Headers('x-org-id') orgId: string,
    @User('id') userId: string,
    @Param('id') id: string,
    @ClientInfo() clientInfo: IClientInfo,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.cancel(orgId, userId, id, dto, clientInfo);
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Check-in phòng họp' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  checkIn(
    @Param('id') id: string,
    @User('id') userId: string,
    @ClientInfo() clientInfo: IClientInfo,
  ) {
    return this.bookingService.checkIn(id, userId, clientInfo);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Mời người tham dự vào đặt phòng' })
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-org-id',
    description: 'ID của tổ chức',
    required: true,
  })
  @UseGuards(AuthGuard('jwt'))
  invite(
    @Headers('x-org-id') orgId: string,
    @User('id') userId: string,
    @Param('id') id: string,
    @Body() dto: InviteAttendeesDto,
  ) {
    return this.bookingService.inviteAttendees(orgId, userId, id, dto);
  }

  @Post(':id/end-early')
  @ApiOperation({ summary: 'Kết thúc phòng họp sớm' })
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-org-id',
    description: 'ID của tổ chức',
    required: true,
  })
  @UseGuards(AuthGuard('jwt'))
  endEarly(
    @Headers('x-org-id') orgId: string,
    @User('id') userId: string,
    @Param('id') id: string,
    @ClientInfo() clientInfo: IClientInfo,
  ) {
    return this.bookingService.endEarly(orgId, userId, id, clientInfo);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Duyệt đặt phòng' })
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-org-id',
    description: 'ID của tổ chức',
    required: true,
  })
  @UseGuards(AuthGuard('jwt'))
  approve(
    @Headers('x-org-id') orgId: string,
    @User('id') userId: string,
    @Param('id') id: string,
    @ClientInfo() clientInfo: IClientInfo,
  ) {
    return this.bookingService.approve(orgId, userId, id, clientInfo);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Từ chối đặt phòng' })
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-org-id',
    description: 'ID của tổ chức',
    required: true,
  })
  @UseGuards(AuthGuard('jwt'))
  reject(
    @Headers('x-org-id') orgId: string,
    @User('id') userId: string,
    @Param('id') id: string,
    @ClientInfo() clientInfo: IClientInfo,
    @Body() dto: RejectBookingDto,
  ) {
    return this.bookingService.reject(orgId, userId, id, dto, clientInfo);
  }
}

