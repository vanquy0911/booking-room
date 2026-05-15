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
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../commons/decorators/user.decorator';

@ApiTags('booking')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }

  @Post()
  @ApiOperation({ summary: 'Đặt phòng mới' })
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-org-id', description: 'ID của tổ chức', required: true })
  @UseGuards(AuthGuard('jwt'))
  create(
    @Headers('x-org-id') orgId: string,
    @User('id') userId: string,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingService.create(orgId, userId, createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đặt phòng' })
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-org-id', description: 'ID của tổ chức', required: true })
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
  @ApiHeader({ name: 'x-org-id', description: 'ID của tổ chức', required: true })
  @UseGuards(AuthGuard('jwt'))
  findOne(@Headers('x-org-id') orgId: string, @Param('id') id: string) {
    return this.bookingService.findOne(orgId, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Hủy đặt phòng' })
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-org-id', description: 'ID của tổ chức', required: true })
  @UseGuards(AuthGuard('jwt'))
  cancel(
    @Headers('x-org-id') orgId: string,
    @User('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.cancel(orgId, userId, id, dto);
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Check-in phòng họp' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  checkIn(
    @Param('id') id: string,
    @User('id') userId: string,
  ) {
    return this.bookingService.checkIn(id, userId);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Mời người tham dự vào đặt phòng' })
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-org-id', description: 'ID của tổ chức', required: true })
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
  @ApiHeader({ name: 'x-org-id', description: 'ID của tổ chức', required: true })
  @UseGuards(AuthGuard('jwt'))
  endEarly(
    @Headers('x-org-id') orgId: string,
    @User('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.bookingService.endEarly(orgId, userId, id);
  }
}
