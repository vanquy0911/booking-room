import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';
import { Room } from '../../room/entities/room.entity';
import { User } from '../../user/entities/user.entity';

@Entity('booking_series')
export class BookingSeries {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // FK -> organizations
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // FK -> rooms
  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  // FK -> users
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({
    type: 'text',
    comment: 'RFC 5545 RRULE string (e.g., FREQ=WEEKLY;BYDAY=MO,WE)',
  })
  rrule: string;

  @Column({
    type: 'timestamptz',
    comment: 'Thời điểm bắt đầu của instance đầu tiên',
  })
  dtstart: Date;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes: number;

  @Column({
    name: 'until_at',
    type: 'timestamptz',
    nullable: true,
    comment: 'Thời điểm kết thúc của toàn bộ chuỗi lặp',
  })
  untilAt: Date;

  @Column({
    name: 'materialized_through',
    type: 'timestamptz',
    comment: 'Đã sinh các bản ghi Booking instance tới thời điểm này',
  })
  materializedThrough: Date;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt: Date;
}
