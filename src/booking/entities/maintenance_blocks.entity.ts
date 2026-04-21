import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Room } from '../../room/entities/room.entity';
import { User } from '../../user/entities/user.entity';

@Entity('maintenance_blocks')
export class MaintenanceBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // FK -> rooms
  @Column({ type: 'uuid' })
  room_id: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  // Khoảng thời gian bảo trì (Sử dụng tstzrange để tránh xung đột lịch đặt phòng)
  @Column({ type: 'tstzrange' })
  time_range: string;

  @Column({ type: 'varchar', length: 255 })
  reason: string;

  // Hỗ trợ khóa phòng định kỳ (ví dụ: Dọn dẹp mỗi sáng thứ 2)
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Recurring maintenance rule (RFC 5545)',
  })
  rrule: string;

  // FK -> users
  @Column({ type: 'uuid' })
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  created_at: Date;
}
