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
  @Column({ type: 'uuid' })
  organization_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // FK -> rooms
  @Column({ type: 'uuid' })
  room_id: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  // FK -> users
  @Column({ type: 'uuid' })
  created_by: string;

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

  @Column({ type: 'int' })
  duration_minutes: number;

  @Column({
    type: 'timestamptz',
    nullable: true,
    comment: 'Thời điểm kết thúc của toàn bộ chuỗi lặp',
  })
  until_at: Date;

  @Column({
    type: 'timestamptz',
    comment: 'Đã sinh các bản ghi Booking instance tới thời điểm này',
  })
  materialized_through: Date;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamptz', nullable: true })
  cancelled_at: Date;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  created_at: Date;
}
