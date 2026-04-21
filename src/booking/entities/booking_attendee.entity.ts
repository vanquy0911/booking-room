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
  @Column({ type: 'uuid' })
  booking_id: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  // FK -> users (Có thể NULL nếu là khách mời bên ngoài)
  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Email khách mời bên ngoài
  @Column({ type: 'citext', nullable: true })
  external_email: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'invited',
    comment: "'invited'|'accepted'|'declined'|'tentative'",
  })
  response_status: string;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  created_at: Date;
}
