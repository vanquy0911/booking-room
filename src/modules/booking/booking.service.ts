import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { FindBookingsDto, SortOrder } from './dto/find-bookings.dto';
import { Room } from '../room/entities/room.entity';
import { Organization } from '../organization/entities/organization.entity';
import { OrganizationMember } from '../organization/entities/organization_members.entity';
import { BookingAttendee } from './entities/booking_attendee.entity';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { RejectBookingDto } from './dto/reject-booking.dto';
import { InviteAttendeesDto } from './dto/invite-attendees.dto';
import { AuditService } from '../audit_log/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingInvitedEvent } from '../notification/events/booking-invited.event';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { IClientInfo } from '../../commons/decorators/client-info.decorator';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,

    @InjectRepository(BookingAttendee)
    private readonly attendeeRepository: Repository<BookingAttendee>,

    @InjectRepository(OrganizationMember)
    private readonly organizationMemberRepository: Repository<OrganizationMember>,

    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) { }

  async create(
    orgId: string,
    userId: string,
    dto: CreateBookingDto,
    clientInfo?: IClientInfo,
  ) {
    const { roomId, startTime, endTime, title, description, attendees } = dto;

    // 1. Lấy thông tin phòng và tổ chức
    const room = await this.roomRepository.findOne({
      where: { id: roomId, organizationId: orgId, isActive: true },
    });
    if (!room) {
      throw new BadRequestException(
        'Phòng không tồn tại hoặc đã bị vô hiệu hóa',
      );
    }

    const org = await this.organizationRepository.findOne({
      where: { id: orgId },
    });
    if (!org) {
      throw new BadRequestException('Tổ chức không tồn tại');
    }

    // 2. Validation thời gian
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    const now = dayjs();

    // a. start < end
    if (!start.isBefore(end)) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải trước thời gian kết thúc',
      );
    }

    // b. start >= now
    if (start.isBefore(now.subtract(1, 'minute'))) {
      throw new BadRequestException('Thời gian bắt đầu không được ở quá khứ');
    }

    // c. Duration [min, max]
    const durationMinutes = end.diff(start, 'minute');
    if (
      durationMinutes < room.minDurationMinutes ||
      durationMinutes > room.maxDurationMinutes
    ) {
      throw new BadRequestException(
        `Thời gian đặt phòng phải từ ${room.minDurationMinutes} đến ${room.maxDurationMinutes} phút`,
      );
    }

    // d. Advance days
    const maxAdvanceDate = now.add(room.advanceBookingDays, 'day').endOf('day');
    if (start.isAfter(maxAdvanceDate)) {
      throw new BadRequestException(
        `Bạn chỉ có thể đặt trước tối đa ${room.advanceBookingDays} ngày`,
      );
    }

    // e. Allowed days (Weekday)
    const dayOfWeek = start.day() === 0 ? 7 : start.day();
    const allowedDays = room.allowedDays || org.workingDays;
    if (!allowedDays.includes(dayOfWeek)) {
      throw new BadRequestException(
        'Ngày này không nằm trong thời gian làm việc của phòng/tổ chức',
      );
    }

    // f. Working hours
    const startHour = start.format('HH:mm');
    const endHour = end.format('HH:mm');
    if (org.workingHoursStart && org.workingHoursEnd) {
      if (startHour < org.workingHoursStart || endHour > org.workingHoursEnd) {
        throw new BadRequestException(
          `Thời gian đặt phòng phải nằm trong khung giờ ${org.workingHoursStart} - ${org.workingHoursEnd}`,
        );
      }
    }

    // 3. Xác định trạng thái
    const status = room.requiresApproval
      ? BookingStatus.PENDING
      : BookingStatus.CONFIRMED;

    // 4. Thực hiện lưu bằng Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const timeRange = `[${start.toISOString()}, ${end.toISOString()}]`;

      const booking = queryRunner.manager.create(Booking, {
        organizationId: orgId,
        roomId,
        createdBy: userId,
        title,
        description,
        timeRange,
        status,
      });

      const savedBooking = await queryRunner.manager.save(booking);

      if (attendees && attendees.length > 0) {
        await this.processInvitations(
          savedBooking,
          attendees,
          queryRunner.manager,
        );
      }

      await queryRunner.commitTransaction();

      await this.auditService.logAction({
        organizationId: orgId,
        actorId: userId,
        action: 'booking.create',
        entityType: 'booking',
        entityId: savedBooking.id,
        ipAddress: clientInfo?.ip,
        userAgent: clientInfo?.userAgent,
        metadata: { title: savedBooking.title, status: savedBooking.status },
      });

      return {
        message:
          status === BookingStatus.PENDING
            ? 'Yêu cầu đặt phòng đã được gửi và đang chờ phê duyệt'
            : 'Đặt phòng thành công',
        data: savedBooking,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err.code === '23P01') {
        throw new ConflictException('ROOM_ALREADY_BOOKED');
      }
      throw new BadRequestException('Lỗi khi đặt phòng: ' + err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(orgId: string, currentUserId: string, dto: FindBookingsDto) {
    const {
      userId,
      roomId,
      locationId,
      status,
      startAt,
      endAt,
      mine,
      sort,
      cursor,
      limit,
    } = dto;

    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.room', 'room')
      .leftJoinAndSelect('room.floor', 'floor')
      .where('booking.organizationId = :orgId', { orgId });

    if (mine === 'true') {
      queryBuilder.andWhere('booking.createdBy = :currentUserId', {
        currentUserId,
      });
    } else if (userId) {
      queryBuilder.andWhere('booking.createdBy = :userId', { userId });
    }

    if (roomId) {
      queryBuilder.andWhere('booking.roomId = :roomId', { roomId });
    }

    if (locationId) {
      queryBuilder.andWhere('floor.locationId = :locationId', { locationId });
    }

    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    // 2. Overlap / Time filter
    if (startAt && endAt) {
      queryBuilder.andWhere(
        "booking.timeRange && tstzrange(:startAt, :endAt, '[]')",
        { startAt, endAt },
      );
    } else {
      if (startAt) {
        queryBuilder.andWhere('lower(booking.timeRange) >= :startAt', {
          startAt,
        });
      }
      if (endAt) {
        queryBuilder.andWhere('upper(booking.timeRange) <= :endAt', { endAt });
      }
    }

    // 3. Cursor Pagination & Sort
    const direction = sort === SortOrder.DESC ? '<' : '>';
    const order = sort === SortOrder.DESC ? 'DESC' : 'ASC';

    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('ascii');
      const [cursorTime, cursorId] = decodedCursor.split('|');
      if (cursorTime && cursorId) {
        queryBuilder.andWhere(
          `(lower(booking.timeRange) ${direction} :cursorTime OR (lower(booking.timeRange) = :cursorTime AND booking.id ${direction} :cursorId))`,
          { cursorTime, cursorId },
        );
      }
    }

    queryBuilder.orderBy('booking.timeRange', order);
    queryBuilder.addOrderBy('booking.id', order);
    queryBuilder.take(limit + 1);

    const results = await queryBuilder.getMany();
    const hasNextPage = results.length > limit;
    const data = hasNextPage ? results.slice(0, limit) : results;

    let nextCursor: string | null = null;
    if (hasNextPage) {
      const lastItem = data[data.length - 1];
      const startTimeStr = this.extractStartTime(lastItem.timeRange);
      nextCursor = Buffer.from(`${startTimeStr}|${lastItem.id}`).toString(
        'base64',
      );
    }

    return {
      data,
      nextCursor,
    };
  }

  private extractStartTime(rangeStr: string): string {
    const match = rangeStr.match(/[\[\(]([^,]+)/);
    return match ? match[1].trim().replace(/\"/g, '') : '';
  }

  async findOne(orgId: string, id: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id, organizationId: orgId },
      relations: ['room', 'creator', 'attendees', 'attendees.user', 'approver'],
    });

    if (!booking) {
      throw new BadRequestException('Đặt phòng không tồn tại');
    }

    return booking;
  }

  async getBookingHistory(orgId: string, id: string, userId: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id, organizationId: orgId },
      relations: ['creator', 'approver', 'checkInUser', 'canceller', 'room'],
    });

    if (!booking) {
      throw new NotFoundException('Đặt phòng không tồn tại');
    }

    if (booking.createdBy !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền xem lịch sử thay đổi của đặt phòng này',
      );
    }

    const timeline: Array<{
      event: 'created' | 'approved' | 'rejected' | 'checked_in' | 'cancelled' | 'ended_early';
      time: Date;
      actor: { id: string; name: string; email: string } | null;
      detail: string;
    }> = [];

    // 1. Tạo đặt phòng 
    timeline.push({
      event: 'created',
      time: booking.createdAt,
      actor: booking.creator
        ? { id: booking.creator.id, name: booking.creator.fullName, email: booking.creator.email }
        : null,
      detail: 'Khởi tạo yêu cầu đặt phòng họp',
    });

    // 2. Duyệt hoặc Từ chối (Nếu có)
    if (booking.approvedAt) {
      const isApproved = booking.status !== BookingStatus.REJECTED;
      timeline.push({
        event: isApproved ? 'approved' : 'rejected',
        time: booking.approvedAt,
        actor: booking.approver
          ? { id: booking.approver.id, name: booking.approver.fullName, email: booking.approver.email }
          : null,
        detail: isApproved
          ? 'Yêu cầu đặt phòng đã được phê duyệt'
          : `Yêu cầu đặt phòng bị từ chối với lý do: ${booking.rejectionReason || 'Không có lý do'}`,
      });
    }

    // 3. Check-in (Nếu có)
    if (booking.checkedInAt) {
      timeline.push({
        event: 'checked_in',
        time: booking.checkedInAt,
        actor: booking.checkInUser
          ? { id: booking.checkInUser.id, name: booking.checkInUser.fullName, email: booking.checkInUser.email }
          : null,
        detail: 'Đã check-in điểm danh nhận phòng họp thành công',
      });
    }

    // 4. Hủy đặt phòng (Nếu có)
    if (booking.cancelledAt) {
      timeline.push({
        event: 'cancelled',
        time: booking.cancelledAt,
        actor: booking.canceller
          ? { id: booking.canceller.id, name: booking.canceller.fullName, email: booking.canceller.email }
          : null,
        detail: `Lịch họp đã bị hủy với lý do: ${booking.cancelReason || 'Không có lý do'}`,
      });
    }

    // 5. Kết thúc sớm (Nếu có)
    if (booking.status === BookingStatus.ENDED_EARLY) {
      timeline.push({
        event: 'ended_early',
        time: booking.updatedAt,
        actor: booking.creator
          ? { id: booking.creator.id, name: booking.creator.fullName, email: booking.creator.email }
          : null,
        detail: 'Cuộc họp đã được kết thúc sớm để giải phóng slot phòng',
      });
    }

    // Sắp xếp theo trình tự thời gian tăng dần
    timeline.sort((a, b) => a.time.getTime() - b.time.getTime());

    return {
      bookingId: booking.id,
      title: booking.title,
      roomName: booking.room?.name || 'N/A',
      currentStatus: booking.status,
      timeline,
    };
  }

  async cancel(
    orgId: string,
    userId: string,
    id: string,
    dto: CancelBookingDto,
    clientInfo?: IClientInfo,
  ) {
    const booking = await this.bookingRepository.findOne({
      where: { id, organizationId: orgId },
    });

    if (!booking) {
      throw new BadRequestException('Đặt phòng không tồn tại');
    }

    // Kiểm tra quyền: Admin hoặc Creator mới được hủy
    const membership = await this.organizationMemberRepository.findOne({
      where: { organizationId: orgId, userId },
    });

    const isAdmin = membership?.role === 'admin';
    const isCreator = booking.createdBy === userId;

    if (!isAdmin && !isCreator) {
      throw new ForbiddenException('Bạn không có quyền hủy đặt phòng này');
    }

    if (
      [
        BookingStatus.CANCELLED,
        BookingStatus.REJECTED,
        BookingStatus.COMPLETED,
      ].includes(booking.status)
    ) {
      throw new BadRequestException(
        `Không thể hủy đặt phòng đang ở trạng thái ${booking.status}`,
      );
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledBy = userId;
    booking.cancelledAt = new Date();
    booking.cancelReason = dto.reason;

    const saved = await this.bookingRepository.save(booking);

    await this.auditService.logAction({
      organizationId: orgId,
      actorId: userId,
      action: 'booking.cancel',
      entityType: 'booking',
      entityId: booking.id,
      ipAddress: clientInfo?.ip,
      userAgent: clientInfo?.userAgent,
      metadata: { reason: dto.reason },
    });

    return saved;
  }

  async approve(
    orgId: string,
    userId: string,
    id: string,
    clientInfo?: IClientInfo,
  ) {
    const booking = await this.bookingRepository.findOne({
      where: { id, organizationId: orgId },
    });

    if (!booking) {
      throw new BadRequestException('Đặt phòng không tồn tại');
    }

    const membership = await this.organizationMemberRepository.findOne({
      where: { organizationId: orgId, userId },
    });

    if (membership?.role !== 'admin') {
      throw new ForbiddenException('Chỉ Admin mới có quyền duyệt đặt phòng');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể duyệt các yêu cầu đặt phòng đang chờ (pending)');
    }

    booking.status = BookingStatus.CONFIRMED;
    booking.approvedBy = userId;
    booking.approvedAt = new Date();

    const saved = await this.bookingRepository.save(booking);

    await this.auditService.logAction({
      organizationId: orgId,
      actorId: userId,
      action: 'booking.approve',
      entityType: 'booking',
      entityId: booking.id,
      ipAddress: clientInfo?.ip,
      userAgent: clientInfo?.userAgent,
    });

    return saved;
  }

  async reject(
    orgId: string,
    userId: string,
    id: string,
    dto: RejectBookingDto,
    clientInfo?: IClientInfo,
  ) {
    const booking = await this.bookingRepository.findOne({
      where: { id, organizationId: orgId },
    });

    if (!booking) {
      throw new BadRequestException('Đặt phòng không tồn tại');
    }

    const membership = await this.organizationMemberRepository.findOne({
      where: { organizationId: orgId, userId },
    });

    if (membership?.role !== 'admin') {
      throw new ForbiddenException('Chỉ Admin mới có quyền từ chối đặt phòng');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể từ chối các yêu cầu đặt phòng đang chờ (pending)');
    }

    booking.status = BookingStatus.REJECTED;
    booking.approvedBy = userId;
    booking.approvedAt = new Date();
    booking.rejectionReason = dto.reason;

    const saved = await this.bookingRepository.save(booking);

    await this.auditService.logAction({
      organizationId: orgId,
      actorId: userId,
      action: 'booking.reject',
      entityType: 'booking',
      entityId: booking.id,
      ipAddress: clientInfo?.ip,
      userAgent: clientInfo?.userAgent,
      metadata: { reason: dto.reason },
    });

    return saved;
  }


  async checkIn(bookingId: string, userId: string, clientInfo?: IClientInfo) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['attendees'],
    });

    if (!booking) throw new NotFoundException('Booking không tồn tại');

    if (
      [BookingStatus.CANCELLED, BookingStatus.REJECTED].includes(booking.status)
    ) {
      throw new BadRequestException('Booking đã bị hủy hoặc từ chối');
    }

    if (booking.status === BookingStatus.IN_PROGRESS) {
      throw new BadRequestException('Booking đã được check-in trước đó');
    }

    const isCreator = booking.createdBy === userId;
    const isAttendee = booking.attendees.some((a) => a.userId === userId);

    if (!isCreator && !isAttendee) {
      throw new ForbiddenException('Bạn không có quyền check-in booking này');
    }

    const startTimeStr = this.extractStartTime(booking.timeRange);
    const startTime = dayjs(startTimeStr);
    const now = dayjs();
    const diffMinutes = now.diff(startTime, 'minute');

    if (diffMinutes < -5 || diffMinutes > 15) {
      throw new BadRequestException(
        'Ngoài thời gian cho phép check-in (5p trước đến 15p sau giờ bắt đầu)',
      );
    }

    booking.status = BookingStatus.IN_PROGRESS;
    booking.checkedInAt = new Date();
    booking.checkedInBy = userId;

    const saved = await this.bookingRepository.save(booking);

    await this.auditService.logAction({
      organizationId: booking.organizationId,
      actorId: userId,
      action: 'booking.check_in',
      entityType: 'booking',
      entityId: booking.id,
      ipAddress: clientInfo?.ip,
      userAgent: clientInfo?.userAgent,
    });

    return saved;
  }

  async inviteAttendees(
    orgId: string,
    userId: string,
    bookingId: string,
    dto: InviteAttendeesDto,
  ) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, organizationId: orgId },
    });

    if (!booking) {
      throw new NotFoundException('Đặt phòng không tồn tại');
    }

    if (booking.createdBy !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền mời người khác vào phòng họp này',
      );
    }

    const newAttendees = await this.processInvitations(booking, dto.attendees);

    return {
      message: 'Đã gửi lời mời tham dự',
      data: newAttendees,
    };
  }

  async endEarly(
    orgId: string,
    userId: string,
    bookingId: string,
    clientInfo?: IClientInfo,
  ) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, organizationId: orgId },
    });

    if (!booking) {
      throw new NotFoundException('Đặt phòng không tồn tại');
    }

    // 1. Kiểm tra quyền: Chỉ Creator hoặc Admin của tổ chức mới được phép kết thúc sớm
    const isCreator = booking.createdBy === userId;
    let isAdmin = false;

    if (!isCreator) {
      const membership = await this.organizationMemberRepository.findOne({
        where: { organizationId: orgId, userId: userId },
      });
      isAdmin = membership?.role === 'admin';
    }

    if (!isCreator && !isAdmin) {
      throw new ForbiddenException(
        'Chỉ người tạo hoặc Admin mới có quyền kết thúc phòng họp sớm',
      );
    }

    // 2. Chỉ end khi booking đang hoạt động (đã check-in)
    if (booking.status !== BookingStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Chỉ có thể kết thúc sớm các cuộc họp đang diễn ra (đã check-in)',
      );
    }

    // 3. Cập nhật lại timeRange để nhả slot
    const startTimeStr = this.extractStartTime(booking.timeRange);
    const now = dayjs().toISOString();

    // Đảm bảo thời gian kết thúc mới không sớm hơn thời gian bắt đầu
    if (dayjs().isBefore(dayjs(startTimeStr))) {
      throw new BadRequestException(
        'Không thể kết thúc cuộc họp trước khi nó bắt đầu',
      );
    }

    booking.timeRange = `[${startTimeStr}, ${now}]`;
    booking.status = BookingStatus.ENDED_EARLY;

    const savedBooking = await this.bookingRepository.save(booking);

    await this.auditService.logAction({
      organizationId: orgId,
      actorId: userId,
      action: 'booking.end_early',
      entityType: 'booking',
      entityId: booking.id,
      ipAddress: clientInfo?.ip,
      userAgent: clientInfo?.userAgent,
    });

    return {
      message: 'Đã kết thúc phòng họp sớm và giải phóng slot',
      data: savedBooking,
    };
  }

  private async processInvitations(
    booking: Booking,
    attendeesDto: InviteAttendeesDto['attendees'],
    manager?: any,
  ) {
    if (!attendeesDto || attendeesDto.length === 0) return [];

    const repo = manager
      ? manager.getRepository(BookingAttendee)
      : this.attendeeRepository;

    const existingAttendees = await repo.find({
      where: { bookingId: booking.id },
    });

    const uniqueNewAttendees = attendeesDto.filter((dto) => {
      const isExist = existingAttendees.some(
        (exist) =>
          (dto.userId && exist.userId === dto.userId) ||
          (dto.email && exist.externalEmail === dto.email),
      );
      return !isExist;
    });

    if (uniqueNewAttendees.length === 0) return [];

    if (existingAttendees.length + uniqueNewAttendees.length > 50) {
      throw new BadRequestException(
        'Một phòng họp chỉ được mời tối đa 50 người',
      );
    }

    const newAttendees = uniqueNewAttendees.map((attr) => {
      return repo.create({
        bookingId: booking.id,
        userId: attr.userId,
        externalEmail: attr.email,
        responseStatus: 'invited',
      });
    });

    const savedAttendees = await repo.save(newAttendees);

    this.eventEmitter.emit(
      'booking.invited',
      new BookingInvitedEvent(booking, savedAttendees),
    );

    return savedAttendees;
  }
}
