import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BookingInvitedEvent } from './events/booking-invited.event';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  @OnEvent('booking.invited', { async: true })
  async handleBookingInvitedEvent(payload: BookingInvitedEvent) {
    this.logger.log(
      `Received booking.invited event for booking ${payload.booking.id}`,
    );

    const { booking, attendees } = payload;

    for (const attendee of attendees) {
      const email =
        attendee.externalEmail || (attendee.user ? attendee.user.email : null);
      if (email) {
        // Thực hiện logic gửi mail tại đây
        // Ví dụ: await this.mailerService.sendMail({...})
        this.logger.log(
          `[Email Simulator] Đã gửi thư mời họp tới email: ${email}`,
        );
      } else {
        this.logger.warn(
          `Không tìm thấy email cho attendee ID: ${attendee.id}`,
        );
      }
    }
  }
}
