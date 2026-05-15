import { Booking } from '../../booking/entities/booking.entity';
import { BookingAttendee } from '../../booking/entities/booking_attendee.entity';

export class BookingInvitedEvent {
  constructor(
    public readonly booking: Booking,
    public readonly attendees: BookingAttendee[],
  ) {}
}
