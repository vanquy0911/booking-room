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
  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  // FK -> users
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'desired_start_at', type: 'timestamptz' })
  desiredStartAt: Date;

  @Column({ name: 'desired_end_at', type: 'timestamptz' })
  desiredEndAt: Date;

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
    name: 'offered_at',
    type: 'timestamptz',
    nullable: true,
    comment: 'Thời điểm bắt đầu mời người dùng đặt phòng',
  })
  offeredAt: Date;

  @Column({
    name: 'offer_expires_at',
    type: 'timestamptz',
    nullable: true,
    comment: 'Hết hạn lời mời (thường là +10 phút sau khi offered)',
  })
  offerExpiresAt: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt: Date;
}
