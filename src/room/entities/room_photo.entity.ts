import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { User } from '../../user/entities/user.entity';

@Entity('room_photos')
export class RoomPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // FK -> rooms
  @Column({ type: 'uuid' })
  room_id: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ type: 'varchar', length: 500 })
  storage_key: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '256x256 generated',
  })
  thumbnail_key: string;

  @Column({ type: 'smallint', default: 0 })
  position: number;

  // FK -> users
  @Column({ type: 'uuid', nullable: true })
  uploaded_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @Column({ type: 'int' })
  size_bytes: number;

  @Column({ type: 'varchar', length: 50 })
  mime_type: string;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  created_at: Date;
}
