import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from '../../user/entities/user.entity';

@Entity('booking_attendees')
export class BookingAttendee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // FK -> bookings
  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  // FK -> users (Có thể NULL nếu là khách mời bên ngoài)
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Email khách mời bên ngoài
  @Column({ name: 'external_email', type: 'citext', nullable: true })
  externalEmail: string;

  @Column({
    name: 'response_status',
    type: 'varchar',
    length: 20,
    default: 'invited',
    comment: "'invited'|'accepted'|'declined'|'tentative'",
  })
  responseStatus: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt: Date;
}
