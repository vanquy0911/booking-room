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

@Entity('waitlists')
export class Waitlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // FK -> rooms
  @Column({ type: 'uuid' })
  room_id: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  // FK -> users
  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'timestamptz' })
  desired_start_at: Date;

  @Column({ type: 'timestamptz' })
  desired_end_at: Date;

  @Column({
    type: 'int',
    comment: 'Thứ tự ưu tiên trong hàng đợi (FIFO)',
  })
  position: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'waiting',
    comment: "'waiting'|'offered'|'claimed'|'expired'",
  })
  status: string;

  @Column({
    type: 'timestamptz',
    nullable: true,
    comment: 'Thời điểm bắt đầu mời người dùng đặt phòng',
  })
  offered_at: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
    comment: 'Hết hạn lời mời (thường là +10 phút sau khi offered)',
  })
  offer_expires_at: Date;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  created_at: Date;
}
